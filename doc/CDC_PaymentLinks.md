+-----------------------------------------------------------------------+
| **CAHIER DES CHARGES**                                                |
|                                                                       |
| *Évolution --- Génération de Payment Links Stripe*                    |
|                                                                       |
| Dashboard Admin · NestJS + React/Vite                                 |
+-----------------------------------------------------------------------+

  --------------- -------------------------------------------------------
  **Projet**      Dashboard Admin --- Gestion d\'abonnements Stripe

  --------------- -------------------------------------------------------

  --------------- -------------------------------------------------------
  **Objet**       Ajout de la génération de liens de paiement (Payment
                  Links) rattachés à un customer

  --------------- -------------------------------------------------------

  --------------- -------------------------------------------------------
  **Stack**       NestJS (backend) · React/Vite (frontend) · Stripe API ·
                  MCP Server

  --------------- -------------------------------------------------------

  ------------------- -------------------------------------------------------
  **Environnement**   Mode test Stripe (sk_test\_\...)

  ------------------- -------------------------------------------------------

  --------------- -------------------------------------------------------
  **Version**     v1.1 --- Évolution de la v1.0 (création d\'abonnements)

  --------------- -------------------------------------------------------

**1. Contexte et objectif**

La version 1.0 du dashboard admin permet de créer des plans
d\'abonnement mensuels custom, de gérer les customers Stripe et
d\'assigner des abonnements manuellement via des appels API directs.

L\'objectif de cette évolution est de compléter ce flux en ajoutant la
capacité de générer des Payment Links Stripe --- des URLs de paiement
partageables --- directement rattachées à un customer et un plan
existants.

Ces liens permettent à l\'admin d\'envoyer un lien personnalisé à une
entreprise cliente. Le client clique, renseigne sa carte, et
l\'abonnement s\'active automatiquement côté Stripe, sans intervention
manuelle supplémentaire.

**2. Flux cible**

+-----------------------------------------------------------------------+
| **Parcours complet**                                                  |
|                                                                       |
| ① L\'admin sélectionne un customer existant dans le dashboard         |
|                                                                       |
| ② L\'admin sélectionne un plan existant (price_xxx)                   |
|                                                                       |
| ③ Le dashboard appelle POST /admin/payment-links                      |
|                                                                       |
| ④ NestJS crée le Payment Link via l\'API Stripe                       |
|                                                                       |
| ⑤ L\'URL générée est affichée + copiable dans le dashboard            |
|                                                                       |
| ⑥ L\'admin envoie le lien à l\'entreprise cliente (email, slack...)   |
|                                                                       |
| ⑦ Le client paie → abonnement actif automatiquement dans Stripe       |
+-----------------------------------------------------------------------+

**3. Évolutions backend --- NestJS**

**3.1 Nouveau module : PaymentLinksModule**

Créer un module dédié src/payment-links/ contenant service, controller
et module, branché sur le StripeModule existant.

**3.2 Endpoints à créer**

  ------------- ------------------------------------- ------------------------------------
  **Méthode**   **Route**                             **Description**

  **POST**      /admin/payment-links                  Génère un Payment Link pour un
                                                      customer + plan

  **GET**       /admin/payment-links                  Liste tous les Payment Links
                                                      existants

  **PATCH**     /admin/payment-links/:id/deactivate   Désactive un Payment Link (rend
                                                      l\'URL inactive)
  ------------- ------------------------------------- ------------------------------------

**3.3 Payload POST /admin/payment-links**

+-----------------------------------------------------------------------+
| **Corps de la requête**                                               |
|                                                                       |
| customerId (string, requis) --- ID Stripe du customer cible (cus_xxx) |
|                                                                       |
| priceId (string, requis) --- ID du prix mensuel Stripe (price_xxx)    |
|                                                                       |
| redirectUrl (string, optionnel) --- URL de redirection après paiement |
+-----------------------------------------------------------------------+

**3.4 Réponse retournée**

+-----------------------------------------------------------------------+
| **Corps de la réponse**                                               |
|                                                                       |
| id --- ID du Payment Link Stripe (plink_xxx)                          |
|                                                                       |
| url --- URL de paiement à partager (https://buy.stripe.com/\...)      |
|                                                                       |
| active --- Statut du lien (true / false)                              |
|                                                                       |
| customerId --- ID du customer rattaché                                |
|                                                                       |
| customerName --- Nom du customer                                      |
|                                                                       |
| customerEmail --- Email du customer                                   |
|                                                                       |
| priceId --- ID du plan souscrit                                       |
+-----------------------------------------------------------------------+

**3.5 Intégration dans app.module.ts**

Importer et déclarer PaymentLinksModule dans les imports de AppModule,
au même niveau que PlansModule, SubscriptionsModule et CustomersModule.

**4. Évolutions MCP Server**

**4.1 Tools à ajouter dans src/index.ts**

  ------------- ------------------------- ------------------------------------
  **Méthode**   **Route**                 **Description**

  **POST**      create_payment_link       Génère un lien de paiement pour un
                                          customer + plan

  **GET**       list_payment_links        Liste tous les liens de paiement
                                          existants

  **PATCH**     deactivate_payment_link   Désactive un lien de paiement par
                                          son ID
  ------------- ------------------------- ------------------------------------

**4.2 Rebuild requis**

Après ajout des tools dans src/index.ts, rebuilder le MCP server :

+-----------------------------------------------------------------------+
| **Commande**                                                          |
|                                                                       |
| **cd admin-mcp && npm run build**                                     |
+-----------------------------------------------------------------------+

**4.3 Utilisation dans Claude Code**

Une fois le MCP rebuild et NestJS en cours d\'exécution, piloter via
langage naturel :

-   \"Génère un lien de paiement pour Acme Corp sur le plan Pro\"

-   \"Liste tous les liens de paiement actifs\"

-   \"Désactive le lien plink_xxx\"

**5. Évolutions frontend --- React/Vite**

**5.1 Nouvelle fonction dans src/lib/api.ts**

+-----------------------------------------------------------------------+
| **paymentLinksApi à ajouter**                                         |
|                                                                       |
| list: GET /admin/payment-links                                        |
|                                                                       |
| create: POST /admin/payment-links { customerId, priceId, redirectUrl? |
| }                                                                     |
|                                                                       |
| deactivate: PATCH /admin/payment-links/:id/deactivate                 |
+-----------------------------------------------------------------------+

**5.2 Composant de génération de lien**

Ajouter dans le dashboard une section ou un modal permettant de :

-   Sélectionner un customer existant (liste déroulante alimentée par
    GET /admin/customers)

-   Sélectionner un plan existant (liste déroulante alimentée par GET
    /admin/plans)

-   Cliquer sur « Générer le lien »

-   Afficher l\'URL retournée avec un bouton « Copier »

-   Afficher un tableau des liens générés avec leur statut (actif /
    inactif) et un bouton de désactivation

**6. Contraintes techniques**

-   Le customer doit exister dans Stripe avant la génération du lien ---
    pas de création à la volée dans ce flux

-   Le plan (price) doit être actif et de type récurrent mensuel

-   La clé Stripe ne doit jamais être exposée côté frontend --- tous les
    appels Stripe passent par NestJS

-   En mode test Stripe, les URLs générées commencent par
    https://buy.stripe.com/test\_\...

-   Un Payment Link Stripe n\'est pas limité à un seul usage par défaut
    --- à restreindre si nécessaire via l\'option after_completion ou en
    désactivant le lien après paiement

**7. Critères d\'acceptation**

  --------------------------------------------- ------------- --------------
  **Critère**                                   **Backend**   **Frontend**

  POST /admin/payment-links retourne une URL    **✓**         ---
  valide buy.stripe.com                                       

  L\'URL est fonctionnelle en mode test Stripe  **✓**         ---

  GET /admin/payment-links liste les liens avec **✓**         ---
  customerId                                                  

  PATCH deactivate rend le lien inactif dans    **✓**         ---
  Stripe                                                      

  Le lien généré est affiché et copiable dans   ---           **✓**
  le dashboard                                                

  Le customer et le plan sont sélectionnables   ---           **✓**
  via des listes                                              

  Les tools MCP create/list/deactivate          **✓**         ---
  fonctionnent depuis Claude Code                             
  --------------------------------------------- ------------- --------------

**8. Livrables attendus**

-   **src/payment-links/payment-links.service.ts**

-   **src/payment-links/payment-links.controller.ts**

-   **src/payment-links/payment-links.module.ts**

-   **app.module.ts mis à jour avec PaymentLinksModule**

-   **admin-mcp/src/index.ts mis à jour avec les 3 tools MCP + rebuild**

-   **src/lib/api.ts mis à jour avec paymentLinksApi**

-   **Composant React de génération et affichage des liens**

*Cahier des charges généré automatiquement · Dashboard Admin v1.1 ·
Stripe Payment Links*
