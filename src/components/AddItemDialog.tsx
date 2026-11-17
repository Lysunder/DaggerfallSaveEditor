import React, { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardActionArea, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, InputLabel, List, ListItemButton, ListItemText, MenuItem, Radio, RadioGroup,
  Select, Stack, Step, StepLabel, Stepper, TextField, Typography, Chip,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import SpaIcon from '@mui/icons-material/Spa';
import DiamondIcon from '@mui/icons-material/Diamond';
import WatchIcon from '@mui/icons-material/Watch';
import ChurchIcon from '@mui/icons-material/Church';
import CategoryIcon from '@mui/icons-material/Category';
import { useSaveStore } from '../store/useSaveStore';
import { useNotification } from '../context/NotificationContext';
import {
  ARMOR_MATERIAL_NAMES, CLOTHING_DYES, ITEM_TYPES, WEAPON_MATERIAL_NAMES, armorVariants, bodyMorphology, buildItem,
  catalog, isArrow, isStackable, type ArmorMaterial, type BuildOptions, type CatalogEntry, type ClothingDye, type Gender,
  type ItemTypeId, type WeaponMaterial,
} from '../utils/itemBuilder';

export type ItemTarget = 'items' | 'wagonItems';

/** Mount only while open, so each use starts from the first step. */
interface AddItemDialogProps {
  onClose: () => void;
  /** Where the item goes by default: the tab that was open. */
  defaultTarget: ItemTarget;
}

const TYPE_ICONS: Record<ItemTypeId, React.ReactNode> = {
  weapons: <GavelIcon />, armor: <ShieldIcon />, clothing: <CheckroomIcon />, ingredients: <SpaIcon />,
  gems: <DiamondIcon />, jewellery: <WatchIcon />, religious: <ChurchIcon />, misc: <CategoryIcon />,
};

/** Quantity limits: DFU doesn't cap stacks, so this is only a sanity limit. Separate copies stay few. */
const MAX_STACK = 999;
const MAX_COPIES = 20;

const spaced = (name: string) => name.replace(/([a-z])([A-Z])/g, '$1 $2');

const hasOptions = (type: ItemTypeId | null) => type === 'weapons' || type === 'armor' || type === 'clothing';

/** The name DFU shows for weapons and armor, which puts the material in front (e.g. "Ebony Dagger"). */
const displayName = (options: BuildOptions) => {
  const name = options.entry.template.name;
  if (options.type === 'weapons' && !isArrow(options.entry.templateIndex)) return `${options.weaponMaterial} ${name}`;
  if (options.type === 'armor') return `${options.armorMaterial} ${name}`;
  return name;
};

export const AddItemDialog: React.FC<AddItemDialogProps> = ({ onClose, defaultTarget }) => {
  const playerEntity = useSaveStore((state) => state.saveData?.playerData?.playerEntity);
  const addItems = useSaveStore((state) => state.addItems);
  const { showNotification } = useNotification();

  const [step, setStep] = useState(0);
  const [type, setType] = useState<ItemTypeId | null>(null);
  const [entry, setEntry] = useState<CatalogEntry | null>(null);
  const [search, setSearch] = useState('');
  const [weaponMaterial, setWeaponMaterial] = useState<WeaponMaterial>('Iron');
  const [armorMaterial, setArmorMaterial] = useState<ArmorMaterial>('Leather');
  const [variant, setVariant] = useState(0);
  const [dye, setDye] = useState<ClothingDye>('Blue');
  const [quantityText, setQuantityText] = useState('1');
  const [target, setTarget] = useState<ItemTarget>(defaultTarget);

  const gender: Gender = playerEntity?.gender === 'Female' || playerEntity?.gender === 1 ? 'Female' : 'Male';
  const raceId: number = playerEntity?.raceTemplate?.ID ?? -1;
  const raceSupported = bodyMorphology(raceId).supported;
  // DFU only lets the player reach the wagon with a small cart (Transportation group index 0).
  const hasCart = (playerEntity?.items ?? []).some((item) => item.itemGroup === 'Transportation' && item.groupIndex === 0);

  const entries = useMemo(() => (type ? catalog(type, gender) : []), [type, gender]);
  const visibleEntries = entries.filter((e) => e.template.name.toLowerCase().includes(search.trim().toLowerCase()));

  const steps = ['Type', 'Item', ...(hasOptions(type) ? ['Options'] : []), 'Review'];
  const stepName = steps[step];

  const variantChoices = useMemo(() => {
    if (!entry) return [0];
    if (type === 'armor') return armorVariants(entry.templateIndex, armorMaterial);
    if (type === 'clothing') return Array.from({ length: Math.max(entry.template.variants, 1) }, (_, i) => i);
    return [0];
  }, [entry, type, armorMaterial]);
  const chosenVariant = variantChoices.includes(variant) ? variant : variantChoices[0];

  const stackable = entry ? isStackable(entry.templateIndex) : false;
  const maxQuantity = stackable ? MAX_STACK : MAX_COPIES;
  const parsedQuantity = parseInt(quantityText, 10);
  const quantityValid = Number.isInteger(parsedQuantity) && parsedQuantity >= 1 && parsedQuantity <= maxQuantity;
  const quantity = quantityValid ? parsedQuantity : 1;
  const effectiveTarget: ItemTarget = target === 'wagonItems' && !hasCart ? 'items' : target;

  const buildOptions: BuildOptions | null = type && entry
    ? { type, entry, gender, raceId, weaponMaterial, armorMaterial, variant: chosenVariant, dye, quantity }
    : null;
  const preview = buildOptions ? buildItem(buildOptions) : null;

  const chooseType = (id: ItemTypeId) => {
    setType(id);
    setEntry(null);
    setSearch('');
    setStep(1);
  };

  const chooseEntry = (choice: CatalogEntry) => {
    setEntry(choice);
    setVariant(0);
    setQuantityText(choice.templateIndex === 131 ? '20' : '1');
    setStep(2);
  };

  const confirm = () => {
    if (!buildOptions || !preview || !quantityValid) return;
    // Stackable items go in as one stack; anything else is added as separate copies.
    const items = stackable ? [preview] : Array.from({ length: quantity }, () => buildItem(buildOptions));
    const ids = addItems(effectiveTarget, items);
    if (ids.length === 0) {
      showNotification("The item couldn't be added.", 'error');
      return;
    }
    const where = effectiveTarget === 'items' ? 'inventory' : 'wagon';
    const count = quantity > 1 ? `${quantity} × ` : '';
    showNotification(`Added ${count}${displayName(buildOptions)} to the ${where}. Save to write it to the file.`, 'success');
    onClose();
  };

  const canAdvance = stepName === 'Options' || (stepName === 'Item' && entry !== null);

  const renderType = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
      {ITEM_TYPES.map((itemType) => (
        <Card key={itemType.id} variant="outlined" sx={{ borderColor: type === itemType.id ? 'primary.main' : undefined }}>
          <CardActionArea onClick={() => chooseType(itemType.id)} sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ color: 'primary.main', mt: 0.25 }}>{TYPE_ICONS[itemType.id]}</Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{itemType.label}</Typography>
                <Typography variant="body2" color="text.secondary">{itemType.description}</Typography>
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );

  const renderItem = () => (
    <Stack spacing={2}>
      <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
      <List dense sx={{ maxHeight: 360, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
        {visibleEntries.map((choice) => (
          <ListItemButton
            key={`${choice.group}-${choice.templateIndex}`}
            selected={entry?.templateIndex === choice.templateIndex}
            onClick={() => chooseEntry(choice)}
          >
            <ListItemText
              primary={choice.template.name}
              secondary={`${choice.template.baseWeight} kg · ${choice.template.basePrice} gold${type === 'weapons' || type === 'armor' ? ' (base)' : ''}`}
            />
            {choice.subgroup && <Chip size="small" label={choice.subgroup} variant="outlined" />}
          </ListItemButton>
        ))}
        {visibleEntries.length === 0 && (
          <Typography sx={{ p: 2 }} color="text.secondary">No items match “{search}”.</Typography>
        )}
      </List>
    </Stack>
  );

  const renderOptions = () => (
    <Stack spacing={3} sx={{ mt: 1 }}>
      {type === 'weapons' && entry && !isArrow(entry.templateIndex) && (
        <FormControl fullWidth>
          <InputLabel>Material</InputLabel>
          <Select label="Material" value={weaponMaterial} onChange={(e) => setWeaponMaterial(e.target.value as WeaponMaterial)}>
            {WEAPON_MATERIAL_NAMES.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
          </Select>
        </FormControl>
      )}
      {type === 'weapons' && entry && isArrow(entry.templateIndex) && (
        <Typography color="text.secondary">Arrows have no material. Choose how many on the next step.</Typography>
      )}
      {type === 'armor' && (
        <FormControl fullWidth>
          <InputLabel>Material</InputLabel>
          <Select label="Material" value={armorMaterial} onChange={(e) => setArmorMaterial(e.target.value as ArmorMaterial)}>
            {ARMOR_MATERIAL_NAMES.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
          </Select>
        </FormControl>
      )}
      {(type === 'armor' || type === 'clothing') && variantChoices.length > 1 && (
        <FormControl fullWidth>
          <InputLabel>Style</InputLabel>
          <Select label="Style" value={chosenVariant} onChange={(e) => setVariant(Number(e.target.value))}>
            {variantChoices.map((v, i) => <MenuItem key={v} value={v}>Style {i + 1}</MenuItem>)}
          </Select>
        </FormControl>
      )}
      {type === 'clothing' && (
        <FormControl fullWidth>
          <InputLabel>Dye</InputLabel>
          <Select label="Dye" value={dye} onChange={(e) => setDye(e.target.value as ClothingDye)}>
            {CLOTHING_DYES.map((name) => <MenuItem key={name} value={name}>{spaced(name)}</MenuItem>)}
          </Select>
        </FormControl>
      )}
      {preview && (type === 'weapons' || type === 'armor') && (
        <Typography color="text.secondary">
          Condition {preview.hits2} · {preview.weightInKg} kg · {preview.value1} gold
        </Typography>
      )}
    </Stack>
  );

  const renderReview = () => preview && buildOptions && (
    <Stack spacing={2} sx={{ mt: 1 }}>
      {!raceSupported && (type === 'armor' || type === 'clothing') && (
        <Alert severity="warning">
          This character's race isn't one Daggerfall Unity builds armor and clothing for, so the item uses the human body shape.
        </Alert>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 3, rowGap: 0.5 }}>
        <Typography color="text.secondary">Item</Typography><Typography sx={{ fontWeight: 'bold' }}>{displayName(buildOptions)}</Typography>
        <Typography color="text.secondary">Weight</Typography><Typography>{preview.weightInKg} kg</Typography>
        <Typography color="text.secondary">Value</Typography><Typography>{preview.value1} gold</Typography>
        <Typography color="text.secondary">Condition</Typography><Typography>{preview.hits1} / {preview.hits2}</Typography>
        {type === 'clothing' && (<><Typography color="text.secondary">Dye</Typography><Typography>{spaced(dye)}</Typography></>)}
      </Box>
      <TextField
        label={stackable ? 'Quantity (one stack)' : 'Copies (separate items)'}
        type="number"
        value={quantityText}
        onChange={(e) => setQuantityText(e.target.value)}
        error={!quantityValid}
        helperText={quantityValid ? undefined : `Enter a whole number from 1 to ${maxQuantity}.`}
        slotProps={{ htmlInput: { min: 1, max: maxQuantity, step: 1 } }}
        sx={{ maxWidth: 240 }}
      />
      <FormControl>
        <Typography color="text.secondary" variant="body2">Add to</Typography>
        <RadioGroup row value={effectiveTarget} onChange={(e) => setTarget(e.target.value as ItemTarget)}>
          <FormControlLabel value="items" control={<Radio />} label="Inventory" />
          <FormControlLabel value="wagonItems" control={<Radio />} label="Wagon" disabled={!hasCart} />
        </RadioGroup>
        {!hasCart && (
          <Typography variant="caption" color="text.secondary">The wagon needs a small cart in the inventory.</Typography>
        )}
      </FormControl>
    </Stack>
  );

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Item</DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
        {stepName === 'Type' && renderType()}
        {stepName === 'Item' && renderItem()}
        {stepName === 'Options' && renderOptions()}
        {stepName === 'Review' && renderReview()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Box sx={{ flexGrow: 1 }} />
        {step > 0 && <Button onClick={() => setStep(step - 1)}>Back</Button>}
        {stepName !== 'Review' && step > 0 && (
          <Button variant="outlined" disabled={!canAdvance} onClick={() => setStep(step + 1)}>Next</Button>
        )}
        {stepName === 'Review' && (
          <Button variant="contained" disabled={!quantityValid} onClick={confirm}>Add</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
