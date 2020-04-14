import {red} from '@material-ui/core/colors';
import {createMuiTheme} from '@material-ui/core/styles';

// A custom theme for this app
const theme = createMuiTheme({
  palette: {
    type: "light",
    primary: {
      main: '#fcf',
    },
    secondary: {
      main: '#909',
    },
    error: {
      main: red.A400,
    },
    background: {
      default: '#fff',
    },
  },
});

export default theme;
