import { Backdrop, CircularProgress } from "@mui/material";

interface BackdropSpinnerProp {
  bgColor?: string;
  color?: string;
  position?: string;
  open?: boolean;
}

const BackdropSpinner = ({
  bgColor = "gray",
  color = "#fff",
  position = "fixed",
  open = false,
}: BackdropSpinnerProp) => {
  return (
    <div className="mt-10 h-full w-full bg-transparent">
      <Backdrop
        sx={{
          background: bgColor,
          color: color,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          position: position,
        }}
        open={open}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
};

export default BackdropSpinner;
