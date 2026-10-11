# back-end

## Unit tests

Voer de unit tests uit met `bun run test:unit`. De routes worden met Fastify-inject en mockdatabases getest, dus MongoDB en PostgreSQL zijn niet nodig.

- Boeken ophalen: controleert dat boekgegevens worden gecombineerd met leesstatus en dat boeken zonder leeslijstvermelding als ongelezen en niet opgeslagen terugkomen.
- Boek toevoegen aan de leeslijst: controleert een nieuwe toevoeging, voorkomt een dubbele toevoeging en wijst een ontbrekende boek-id af.
- Docent koppelen aan een student: controleert een geslaagde koppeling en voorkomt koppelingen met een onbekende docent of een bestaande relatie.

Deze gevallen laten zien wat de kernlogica teruggeeft en waarom duplicaten en ontbrekende invoer apart worden gecontroleerd.

