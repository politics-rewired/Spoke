import { makeStyles } from "@material-ui/core/styles";

const useChipStyles = makeStyles((theme) => ({
  unstarted: {
    backgroundColor: theme.palette.action.disabledBackground
  },
  sending: {
    backgroundColor: theme.palette.success.main
  },
  paused: {
    backgroundColor: theme.palette.error.main
  },
  complete: {
    backgroundColor: theme.palette.success.light
  }
}));

export default useChipStyles;
