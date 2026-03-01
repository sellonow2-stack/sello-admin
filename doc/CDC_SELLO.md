CAHIER DES CHARGES : SELLO ADMIN DASHBOARD (V1.0)
1. OBJECTIF DU PROJET
Créer une interface d'administration centralisée pour piloter l'activité de Sello, gérer les utilisateurs, surveiller les performances de l'IA et analyser la rentabilité du business en temps réel.



.ARCHITECTURE DES PAGES & FONCTIONNALITÉS
MODULE 1 : VUE MACRO (Business Health)
L'objectif est d'afficher les North Star Metrics sur une seule page.
• KPIs Cards : * MRR : Somme des abonnements actifs.
◦ CA Brut : Total (Abos + Packs crédits) sur J-7, M-1, Y-1.
◦ Conversion Rate : % de Visiteurs → Inscrits et % Free → Payants.
• Graphiques :
◦ Courbe de croissance des nouveaux inscrits (Daily/Weekly).
◦ Histogramme de répartition des revenus (Smart vs Pro vs Packs).
• Démographie : Distribution par âge des utilisateurs (Data visualisée).
MODULE 2 : ANALYTICS PRODUIT (L'Usage IA)
Comprendre comment les utilisateurs consomment Sello.
• Répartition Studio vs Lifestyle : Ratio en % des générations effectuées.
• Intelligence Catégories : Classement automatique des objets détectés (ex: 1. Sneakers, 2. Sacs, 3. Chaises).
• Marques : % d'objets avec marque identifiée vs non identifiée.
• Funnel d'Export : Graphique de destination (Boutons cliqués : Vinted, LBC, eBay).
• Performance : Temps moyen de génération (Upload → Export).
MODULE 3 : GESTION UTILISATEURS & CRM
L'interface pour agir manuellement sur les comptes.
• Recherche & Fiche Client :
◦ Modifier le type d'abonnement (Passer un user en "Sur Mesure").
◦ Crédits : Ajouter/Soustraire des crédits manuellement (Geste commercial).
◦ Historique des dernières créations de l'utilisateur.
• Parrainage : * Générer des liens de parrainage uniques.
◦ Suivre le nombre de clics et conversions par lien d'influenceur/partenaire.
MODULE 4 : IA & PROMPT MANAGEMENT
Le "Playground" de l'admin pour ne pas toucher au code à chaque changement.
• Prompt Editor : Champ de texte pour modifier le System Prompt (Studio et Lifestyle).
• Versionnage : Possibilité d'enregistrer une version du prompt et de revenir en arrière.
• A/B Testing : Option pour envoyer 10% des users sur un nouveau prompt et comparer les retours.
MODULE 5 : SUPPORT & RÉTENTION
• Feedback Loop : Dashboard affichant les derniers messages envoyés via le chat de l'app.
• Analyse de Cohorte : Tableau de rétention (Mois 1, 2, 3...) pour identifier le Churn.
• Alertes Churn : Liste des utilisateurs "Pro" n'ayant pas généré d'image depuis 10 jours.

4. DESIGN & UX
• Filtres Globaux : Pouvoir filtrer tout le dashboard par date (Aujourd'hui, 7 jours, 30 jours, Custom).
• Export CSV : Bouton pour exporter les listes d'utilisateurs ou de transactions.

5. LOGIQUE DE DONNÉES (POUR LE DEV)
Note au développeur : Les données de catégories d'objets et de marques doivent être extraites des métadonnées renvoyées par l'API de vision ou stockées lors de la génération. Le funnel d'export nécessite un tracking d'événement (Event Listeners) sur les boutons de sortie.




