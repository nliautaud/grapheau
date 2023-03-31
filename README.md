# Explorateur des analyses de qualité de l'eau potable des commune françaises

Visualisée sous forme de graphique, l'évolution d'un paramètre permet d'identifier les valeurs habituelles, des mesures hors-normes (ici mises en valeur), ainsi que des tendances ou des récurrences.

https://nliautaud.github.io/grapheau/

|![image](https://user-images.githubusercontent.com/761761/228780725-93342f63-e5ef-48d3-8ec7-c1f34e4750ee.png)|![image](https://user-images.githubusercontent.com/761761/228779385-b0e01b8a-719d-4a07-9123-c2e385b7af7c.png)|
|--|--|

### Données

Les données d'origine sont les valeurs de prélèvements et résultats des analyses réalisées dans le cadre du contrôle sanitaire réglementaire sur les unités de distribution ou les installations directement en amont, et liens entre communes et unités de distribution, diffusés sous la forme de bulletins sur le site internet du Ministère en charge de la santé : http://eaupotable.sante.gouv.fr/.

Les données formalisées sont récupérées via l'[API *Qualité de l'eau potable* Hub'eau](https://hubeau.eaufrance.fr/page/api-qualite-eau-potable), du service public d'information sur l'eau Eaufrance, faisant l'interface vers le jeu de données *Résultats du contrôle sanitaire de l'eau distribuée commune par commune* sur [data.gouv.fr](https://www.data.gouv.fr/fr/datasets/resultats-du-controle-sanitaire-de-leau-distribuee-commune-par-commune/).

<details>
<summary>Exemple de paramètres analysés</summary>

- Acrylamide
- Ammonium (en NH4)
- Antimoine
- Aspect (qualitatif)
- Bact. aér. revivifiables à 22°-68h
- Bact. aér. revivifiables à 36°-44h
- Bact. et spores sulfito-rédu./100ml
- Bactéries coliformes /100ml-MS
- Benzo(a)pyrène *
- Benzo(b)fluoranthène
- Benzo(g,h,i)pérylène
- Benzo(k)fluoranthène
- Bromoforme
- Cadmium
- Chlore libre
- Chlore total
- Chlorodibromométhane
- Chloroforme
- Chlorure de vinyl monomère
- Chrome total
- Conductivité à 25°C
- Couleur (qualitatif)
- Cuivre
- Dichloroéthane-1,2
- Dichloromonobromométhane
- Entérocoques /100ml-MS
- Epichlorohydrine
- Escherichia coli /100ml - MF
- Fer total
- Fluoranthène *
- Hydrocarbures polycycliques aromatiques (4 substances)
- Hydrocarbures polycycliques aromatiques (6 subst.*)
- Indéno(1,2,3-cd)pyrène
- Nickel
- Nitrates (en NO3)
- Nitrates/50 + Nitrites/3
- Nitrites (en NO2)
- Odeur (qualitatif)
- pH
- Plomb
- Saveur (qualitatif)
- Somme des Trihalométhanes analysés
- Température de l'eau
- Tétrachloroéthylèn+Trichloroéthylène
- Tétrachloroéthylène-1,1,2,2
- Trichloroéthylène
- Trihalométhanes (4 substances)
- Turbidité néphélométrique NFU

</details>

### Fonctionnement

```
1. 👤 Un code postal est entré
2. 🌐 Le service IGN Carto renvoie les communes associées à ce code postal.
3. 👤 Une commune est sélectionnée
4. 🌐 Le service Hub'eau renvoie les différents réseaux d'eau de la commune.
5. 👤 Un réseau d'eau est sélectionné
6. 🌐 Le service Hub'eau renvoie le détail des mesures effectuées sur ce réseau.
7. 📃 Les différents paramètres d'analyse testés sur ce réseau sont listés.
8. 👤 Un paramètre est sélectionné
9. 📉 Un graphique des valeurs mesurées pour ce paramètre dans le temps est affiché
```

-----

|[Rapport Lighthouse](https://htmlpreview.github.io/?https://raw.githubusercontent.com/nliautaud/grapheau/main/lighthouse_results/desktop/nliautaud_github_io_grapheau_.html)|
|--|
|<img src="https://github.com/nliautaud/grapheau/raw/main/lighthouse_results/desktop/pagespeed.svg" alt="lighthouse ratings"  align="center" width="600px" style="max-width: 100%;">|
