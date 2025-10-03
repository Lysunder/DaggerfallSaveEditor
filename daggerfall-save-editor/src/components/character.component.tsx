import { TextField } from "@mui/material";
import React, { useState } from "react";

const CharacterComponent: React.FC = () => {
  const [value, setValue] = useState("");

  return (
    <div>
      <TextField
        id="outlined"
        label="Name"
        defaultValue={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
};

export default CharacterComponent;
