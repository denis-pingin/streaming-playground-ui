import {createMuiTheme} from '@material-ui/core/styles';

// A custom theme for this app
const theme = createMuiTheme({
  palette: {
    type: "light",
    primary: {
      main: '#9F59C6'
    },
    // secondary: {
    //   main: '#DD5CA5'
    // },
    // text: {
    //   primary: "#70209C",
    //   secondary: "#BB1E77"
    // },
    // error: {
    //   main: red.A400,
    // },
    // background: {
    //   default: '#F6B3D9',
    //   paper: '#DAB2F0'
    // },
  },
});

export default theme;
