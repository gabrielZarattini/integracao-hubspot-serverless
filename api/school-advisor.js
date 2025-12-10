import { Client } from '@hubspot/api-client';

export default async function handler(req, res) {
    // 1. Method & Auth Check
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const token = process.env.HUBSPOT_TOKEN_ACCESS;
    if (!token) return res.status(500).json({ error: 'Server Error: Missing HubSpot Token' });

    const hubspotClient = new Client({ accessToken: token });
    const body = req.body;

    try {
        console.log("Payload Received:", JSON.stringify(body));

        // 2. Input Sanitization
        const cleanPhone = body.mobile_phone ? body.mobile_phone.toString().replace(/\D/g, '') : null;

        // Helper: Map Grade Level
        function mapGrade(grade) {
            if (!grade) return null;
            const g = grade.toLowerCase().trim();
            const map = {
                // Infantil (com idade)
                'infantil 1 (até 1 ano)': 'Infantil 1', 'infantil 2 (até 2 anos)': 'Infantil 2',
                'infantil 3 (até 3 anos)': 'Infantil 3', 'infantil 4 (até 4 anos)': 'Infantil 4',
                'infantil 5 (até 5 anos)': 'Infantil 5',
                // Infantil (sem idade)
                'infantil 1': 'Infantil 1', 'infantil 2': 'Infantil 2', 'infantil 3': 'Infantil 3',
                'infantil 4': 'Infantil 4', 'infantil 5': 'Infantil 5',
                // Fundamental (com idade)
                '1º ano (6/7 anos)': '1º ano EF', '2º ano (7/8 anos)': '2º ano EF',
                '3º ano (8/9 anos)': '3º ano EF', '4º ano (9/10 anos)': '4º ano EF',
                '5º ano (10/11 anos)': '5º ano EF', '6º ano (11/12 anos)': '6º ano EF',
                '7º ano (12/13 anos)': '7º ano EF', '8º ano (13/14 anos)': '8º ano EF',
                '9º ano (14/15 anos)': '9º ano EF',
                // Fundamental (sem idade)
                '1o ano': '1º ano EF', '1º ano': '1º ano EF', '1 ano': '1º ano EF',
                '2o ano': '2º ano EF', '2º ano': '2º ano EF', '2 ano': '2º ano EF',
                '3o ano': '3º ano EF', '3º ano': '3º ano EF', '3 ano': '3º ano EF',
                '4o ano': '4º ano EF', '4º ano': '4º ano EF', '4 ano': '4º ano EF',
                '5o ano': '5º ano EF', '5º ano': '5º ano EF', '5 ano': '5º ano EF',
                '6o ano': '6º ano EF', '6º ano': '6º ano EF', '6 ano': '6º ano EF',
                '7o ano': '7º ano EF', '7º ano': '7º ano EF', '7 ano': '7º ano EF',
                '8o ano': '8º ano EF', '8º ano': '8º ano EF', '8 ano': '8º ano EF',
                '9o ano': '9º ano EF', '9º ano': '9º ano EF', '9 ano': '9º ano EF',
                // Medio (com idade)
                '1ª série (15/16 anos)': '1ª série EM', '2ª série (16/17 anos)': '2ª série EM',
                '3ª série (17/18 anos)': '3ª série EM',
                // Medio (sem idade)
                '1a serie': '1ª série EM', '1ª série': '1ª série EM', '1 serie': '1ª série EM',
                '2a serie': '2ª série EM', '2ª série': '2ª série EM', '2 serie': '2ª série EM',
                '3a serie': '3ª série EM', '3ª série': '3ª série EM', '3 serie': '3ª série EM'
            };
            return map[g] || grade;
        }

        const inputs = {
            email: body.email,
            rawPhone: body.mobile_phone,
            cleanPhone: cleanPhone,
            name: body.name,
            studentName: body.student_name,
            unit: body.type,
            grade: mapGrade(body.grade_level),
            source: body.source || "SchoolAdvisor"
        };

        if (!inputs.email && !inputs.cleanPhone) {
            return res.status(400).json({ error: 'Validation Error: Email or Phone required' });
        }

        // 3. Deduplication (Email -> Phone)
        let contactId;
        let foundBy = "None";

        // A. Email Search
        if (inputs.email) {
            const s = await hubspotClient.crm.contacts.searchApi.doSearch({
                filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: inputs.email }] }],
                properties: ['email'], limit: 1
            });
            if (s.total > 0) { contactId = s.results[0].id; foundBy = "Email"; }
        }

        // B. Phone Search (Fallback)
        if (!contactId && inputs.cleanPhone) {
            try {
                const s = await hubspotClient.crm.contacts.searchApi.doSearch({
                    filterGroups: [
                        { filters: [{ propertyName: 'mobilephone', operator: 'CONTAINS_TOKEN', value: inputs.cleanPhone }] },
                        { filters: [{ propertyName: 'hs_whatsapp_phone_number', operator: 'CONTAINS_TOKEN', value: inputs.cleanPhone }] }
                    ],
                    properties: ['email'], limit: 1
                });
                if (s.total > 0) { contactId = s.results[0].id; foundBy = "Phone"; }
            } catch (e) { console.log("Phone search skipped"); }
        }

        // 4. Upsert Contact (Responsável)
        const contactProps = {
            email: inputs.email,
            firstname: inputs.name,
            phone: inputs.rawPhone,
            hs_whatsapp_phone_number: inputs.rawPhone,
            mobilephone: inputs.rawPhone,
            canal: "SEO Local Pago",
            canal_empresa_parceira: inputs.source,
            unidade_de_interesse: inputs.unit,
            // Removed student props from Contact as they are now in Aluno/Deal
            lifecyclestage: 'lead'
        };

        if (contactId) {
            await hubspotClient.crm.contacts.basicApi.update(contactId, { properties: contactProps });
            console.log(`Updated Contact: ${contactId}`);
        } else {
            const c = await hubspotClient.crm.contacts.basicApi.create({ properties: contactProps });
            contactId = c.id;
            console.log(`Created Contact: ${contactId}`);
        }

        // 5. Create Custom Object "Aluno" (2-46165031)
        let alunoId = null;
        if (inputs.studentName) {
            const alunoObj = {
                properties: {
                    nome: inputs.studentName,
                    serie_de_interesse: inputs.grade,
                    aluno1__unidade_de_interesse: inputs.unit
                },
                associations: [
                    {
                        to: { id: contactId },
                        types: [
                            {
                                associationCategory: "USER_DEFINED",
                                associationTypeId: 38 // 38 = Responsável (Aluno -> Contact)
                            }
                        ]
                    }
                ]
            };

            // Note: Using generic object API for Custom Objects
            const a = await hubspotClient.crm.objects.basicApi.create('2-46165031', alunoObj);
            alunoId = a.id;
            console.log(`Created Aluno: ${alunoId}`);
        }

        // 6. Create Deal
        let dealId = null;
        if (inputs.unit) {
            const dealObj = {
                properties: {
                    dealname: "[SchoolAdvisor] - " + (inputs.studentName || inputs.name),
                    pipeline: 'default',
                    dealstage: 'appointmentscheduled',
                    amount: '0',
                    unidade_de_interesse: inputs.unit,
                    serie_de_interesse: inputs.grade,
                    canal: "SEO Local Pago",
                    canal_empresa_parceira: inputs.source
                },
                associations: [
                    {
                        to: { id: contactId },
                        types: [
                            {
                                associationCategory: "HUBSPOT_DEFINED",
                                associationTypeId: 3 // 3 = Deal to Contact
                            }
                        ]
                    }
                ]
            };

            const d = await hubspotClient.crm.deals.basicApi.create(dealObj);
            dealId = d.id;
            console.log(`Created Deal: ${dealId}`);
        }

        return res.status(200).json({ status: "success", contactId, alunoId, dealId, foundBy });

    } catch (e) {
        console.error("Critical Error:", e.message);
        return res.status(500).json({ error: e.message, details: e.response ? e.response.body : null });
    }
}
