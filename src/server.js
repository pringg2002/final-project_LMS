const app = require("./app");
const config = require("./lib/config");

app.listen(config.port, () => {
    console.log(
        `Learning Module API running on port ${config.port}`
    );
});