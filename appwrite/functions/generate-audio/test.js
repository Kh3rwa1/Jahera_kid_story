const func = require('./index.js');

async function test() {
    const req = {
        body: JSON.stringify({
            text: "This is a short test story about a dog.",
            languageCode: "en",
            storyId: "local-test-1234"
        })
    };

    const res = {
        json: (data, statusCode = 200) => {
            console.log(`[RES.JSON] ${statusCode}:`, data);
            return data;
        },
        send: (data, statusCode = 200) => {
            console.log(`[RES.SEND] ${statusCode}:`, data);
            return data;
        }
    };

    const log = (msg) => console.log(`[LOG] ${msg}`);
    const error = (msg) => console.error(`[ERROR] ${msg}`);

    console.log("Running function locally...");
    try {
        await func({ req, res, log, error });
        console.log("Completed!");
    } catch (e) {
        console.error("Uncaught exception in function:", e);
    }
}

(async () => {
  await test();
})();
