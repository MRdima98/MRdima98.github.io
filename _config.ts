import lume from "lume/mod.ts";
import blog from "blog/mod.ts";
import prism from "lume/plugins/prism.ts";

import "npm:prismjs@1.29.0/components/prism-go.js";

const site = lume();

site.use(blog())
  .use(prism({
    theme: {
      name: "funky", // The theme name to download
      path: "/css/code_theme.css", // The destination filename
    },
  }));

site.copy("/css/code_theme.css"); // Copy the css file to dest.


export default site;
