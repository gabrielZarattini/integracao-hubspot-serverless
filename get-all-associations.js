const { Client } = require('@hubspot/api-client');

async function getAssociationTypes() {
    const token = process.env.HUBSPOT_TOKEN_ACCESS;
    if (!token) {
        console.error("Error: HUBSPOT_TOKEN_ACCESS not set");
        process.exit(1);
    }
    const hubspotClient = new Client({ accessToken: token });

    const alunoObjectId = '2-46165031';
    const dealObjectId = '0-3';
    const contactObjectId = '0-1';

    console.log("=== Aluno -> Contact Associations ===");
    try {
        const r1 = await hubspotClient.crm.associations.v4.schema.definitionsApi.getAll(alunoObjectId, contactObjectId);
        console.log(JSON.stringify(r1.results, null, 2));
    } catch (e) { console.error("Error:", e.message); }

    console.log("\n=== Aluno -> Deal Associations ===");
    try {
        const r2 = await hubspotClient.crm.associations.v4.schema.definitionsApi.getAll(alunoObjectId, dealObjectId);
        console.log(JSON.stringify(r2.results, null, 2));
    } catch (e) { console.error("Error:", e.message); }

    console.log("\n=== Deal -> Contact Associations ===");
    try {
        const r3 = await hubspotClient.crm.associations.v4.schema.definitionsApi.getAll(dealObjectId, contactObjectId);
        console.log(JSON.stringify(r3.results, null, 2));
    } catch (e) { console.error("Error:", e.message); }
}

getAssociationTypes();
