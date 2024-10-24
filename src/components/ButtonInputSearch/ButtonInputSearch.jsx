import { SearchOutlined } from "@ant-design/icons";
import React from "react";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import InputComponent from "../InputComponent/InputComponent";

const ButtonInputSearch = (props) => {
  const {
    size,
    placeholder,
    textButton,
    bordered,
    backgroundColorInput = "#fff",
    backgroundColorButton = "rgb(13 , 92, 182)",
    colorButton = "#fff",
  } = props;

  return (
    <div style={{ display: "flex" }}>
      <InputComponent
        size={size}
        placeholder={placeholder}
        bordered={bordered}
        style={{ backgroundColor: backgroundColorInput, borderRadius: "0" }}
      />
      <ButtonComponent
        size={size}
        styleButton={{
          color: "white",
          backgroundColor: "#1e57c8",
          borderRadius: "0",
          background: backgroundColorButton,
          border: !bordered && "none",
        }}
        icon={<SearchOutlined color={colorButton} style={{ color: "#fff" }} />}
        textButton={textButton}
        styleTextButton={{ color: colorButton }}
      />
    </div>
  );
};

export default ButtonInputSearch;
