import { style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { vars, fontStyle } from "@/styles";
import { sansRegular12, sansRegular14 } from "@/styles/font.css";
//import { container as modalContainer } from "../index.css";

const { grayscale500, grayscale200, grayscale50, grayscaleWhite } = vars.color;

export const modalContainer = style({
  display: "none",
  position: "fixed",
  zIndex: 30,
  top: "50%",
  left: "50%",
  minHeight: "20rem",
  minWidth: "32rem",
  padding: "1.6rem",
  borderRadius: "0.8rem",
  boxShadow: "0 0.4rem 0.8rem rgba(0, 0, 0, 0.25)",
  transform: "translate(-50%, -50%)",

  selectors: {
    [`&[open]`]: {
      display: "flex",
    },
  },
});

export const addressWrapper = style({
  display: "flex",
  flex: "1",
  gap: "0.8rem",
  maxHeight: calc.subtract("100%", "5.7rem"),

  "@media": {
    "screen and (max-width: 768px)": {
      flexDirection: "column",
    },
  },
});
export const buttonWrapper = style({
  display: "flex",
  gap: "0.4rem",
});
export const container = style([
  modalContainer,
  {
    width: "90%",
    height: "90%",
  },
]);
export const currentAddress = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "0.4rem",
});

export const form = style({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "0.8rem",
});

export const inputWrapper = style({
  marginBottom: "0.4rem",
  display: "flex",
  flexDirection: "column",
  position: "relative",
});

export const list = style([
  sansRegular12,
  {
    color: grayscale500,
    width: ["100%", "-webkit-fill-available"],
    outline: "none",
    border: `2px solid ${grayscale200}`,
    borderRadius: "0.4rem",
    marginTop: "0.4rem",
    overflowY: "auto",
    cursor: "pointer",
    backgroundColor: grayscaleWhite,
    position: "absolute",
    top: "5rem",
    zIndex: 1,
    height: "94%",
    "@media": {
      "screen and (max-width: 768px)": {
        height: "13rem",
      },
    },
  },
]);

export const listItem = style({
  selectors: {
    [`${list} &`]: {
      padding: "0.8rem",
      borderBottom: `2px solid ${grayscale200}`,
      display: "flex",
      flexDirection: "column",
    },
    [`&:hover`]: {
      backgroundColor: grayscale50,
    },
    [`${list} &:last-child`]: {
      borderBottom: `none`,
    },
  },
});

export const map = style({
  width: "100%",
  height: "100%",
});

export const disabled = style({});

export const error = style({});

export const titleWrapper = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  minHeight: "1.2rem",
  marginBottom: "0.4rem",
});

export const input = style([
  fontStyle.sansRegular14,
  {
    padding: "0.8rem",
    color: vars.color.grayscale500,
    width: ["100%", "-webkit-fill-available"],
    outline: "none",
    border: `2px solid ${vars.color.grayscale200}`,
    borderRadius: "0.4rem",

    selectors: {
      "&:focus": {
        border: `2px solid ${vars.color.morakGreen}`,
      },
      "&::placeholder": {
        color: vars.color.grayscale200,
      },
      [`${error} &`]: {
        border: `2px solid ${vars.color.morakRed}`,
      },
      [`${disabled} &`]: {
        border: `2px solid ${vars.color.grayscale200}`,
        cursor: "not-allowed",
      },
      "&::-webkit-inner-spin-button": {
        appearance: "none",
        MozAppearance: "none",
        WebkitAppearance: "none",
      },
    },
  },
]);

export const errorMessage = style([
  fontStyle.sansRegular14,
  {
    color: vars.color.morakRed,
    marginTop: "0.4rem",
  },
]);

export const count = style([
  fontStyle.sansRegular14,
  {
    visibility: "hidden",

    selectors: {
      [`${container}:focus-within &`]: {
        visibility: "visible",
      },
    },
  },
]);

const { grayscaleBlack, morakRed } = vars.color;

export const label = style([
  sansRegular14,
  {
    color: grayscaleBlack,
  },
]);

export const required = style({
  paddingLeft: "0.2rem",
  color: morakRed,
});
