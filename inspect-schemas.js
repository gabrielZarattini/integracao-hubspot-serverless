const { Client } = require('@hubspot/api-client');

async function listSchemas() {
    const token = process.env.HUBSPOT_TOKEN_ACCESS;
    if (!token) {
        console.error("Error: HUBSPOT_TOKEN_ACCESS not set");
        process.exit(1);
    }

    const hubspotClient = new Client({ accessToken: token });

    try {
        console.log("Fetching schemas...");
        const response = await hubspotClient.crm.schemas.coreApi.getAll();

        console.log("\n--- Custom Objects Found ---");
        response.results.forEach(schema => {
            console.log(`Name: ${schema.name}`);
            console.log(`Label: ${schema.labels.singular}`);
            console.log(`Object Type ID: ${schema.objectTypeId}`);
            console.log(`Fully Qualified Name: ${schema.fullyQualifiedName}`);
            console.log("-------------------");
        });

    } catch (e) {
        console.error("Error fetching schemas:", e.message);
    }
}

listSchemas();
