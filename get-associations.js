const { Client } = require('@hubspot/api-client');

async function getAssociations() {
    const token = process.env.HUBSPOT_TOKEN_ACCESS;
    if (!token) {
        console.error("Error: HUBSPOT_TOKEN_ACCESS not set");
        process.exit(1);
    }
    const hubspotClient = new Client({ accessToken: token });
    const customObjectId = '2-46165031'; // Aluno
    const contactObjectId = '0-1'; // Contact

    try {
        console.log(`Fetching associations between ${customObjectId} and ${contactObjectId}...`);
        const response = await hubspotClient.crm.associations.v4.schema.definitionsApi.getAll(
            customObjectId,
            contactObjectId
        );

        console.log(JSON.stringify(response.results, null, 2));

    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error(JSON.stringify(e.response.body, null, 2));
    }
}

getAssociations();
