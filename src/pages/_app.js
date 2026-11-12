import "@primer/primitives/dist/css/functional/themes/light.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";

import { ThemeProvider, BaseStyles } from "@primer/react";

config.autoAddCss = false;

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <BaseStyles>
        <Component {...pageProps} />
      </BaseStyles>
    </ThemeProvider>
  );
}
