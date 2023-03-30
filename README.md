# Explorateur des prélèvements d'eau potable par commune
Graphiques des résultats de prélèvements règlementaires des réseaux d'eau potable en France.

https://nliautaud.github.io/grapheau/

|![image](https://user-images.githubusercontent.com/761761/228780725-93342f63-e5ef-48d3-8ec7-c1f34e4750ee.png)|![image](https://user-images.githubusercontent.com/761761/228779385-b0e01b8a-719d-4a07-9123-c2e385b7af7c.png)|
|--|--|

### Données

Les données d'origine sont les valeurs de prélèvements et résultats des analyses réalisées dans le cadre du contrôle sanitaire réglementaire sur les unités de distribution ou les installations directement en amont, et liens entre communes et unités de distribution, diffusés sous la forme de bulletins sur le site internet du Ministère en charge de la santé : http://eaupotable.sante.gouv.fr/.

Les données formalisées sont récupérées via l'[API *Qualité de l'eau potable* Hub'eau](https://hubeau.eaufrance.fr/page/api-qualite-eau-potable), du service public d'information sur l'eau Eaufrance, faisant l'interface vers le jeu de données *Résultats du contrôle sanitaire de l'eau distribuée commune par commune* sur [data.gouv.fr](https://www.data.gouv.fr/fr/datasets/resultats-du-controle-sanitaire-de-leau-distribuee-commune-par-commune/).

### Fonctionnement
```
1. 👤 Un code postal est entré
2. 🌐 Le service IGN Carto renvoie les communes associées à ce code postal, et leurs codes communes.
3. 👤 Une commune est sélectionnée
4. 🌐 Le service Hub'eau renvoie les différents réseaux d'eau de la commune.
5. 👤 Un réseau d'eau est sélectionné
6. 🌐 Le service Hub'eau renvoie le détail des mesures effectuées sur ce réseau.
7. 📃 Les différents paramètres d'analyse testés sur ce réseau sont listés.
8. 👤 Un paramètre est sélectionné
9. 📉 Un graphique des valeurs mesurées pour ce paramètre dans le temps est affiché
```

Si les données pour le paramètre choisi indiquent des valeurs minimales et/ou maximales de référence, la plage correspondante est indiquée dans le graphique et les points de données hors référence sont marqués en rouge.
