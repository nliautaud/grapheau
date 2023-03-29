const APICARTO = "https://apicarto.ign.fr/api";
const HUBEAUAPI = "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable";

const codePostal = document.querySelector("#code_postal");
const communes = document.querySelector("#communes");
const reseaux = document.querySelector("#reseaux");
const params = document.querySelector("#paramSelect");
const progress = document.querySelector("progress");
const chartContainer = document.querySelector("#chart");

codePostal.addEventListener("input", onInputCP);
communes.addEventListener("change", updateReseaux);
reseaux.addEventListener("change", updateData);
params.addEventListener("change", updateChart);

const codeCommune = () => communes.options[communes.selectedIndex].value;
const codeReseau = () => reseaux.options[reseaux.selectedIndex].value;
const parameter = () => params.options[params.selectedIndex].text;

var data = [];
var infos = {};
var chart = new CanvasJS.Chart("chart", {
    animationEnabled: false,
    theme: "dark",
    title: {
        fontSize: 16,
    },
    subtitles: [{
        text: "",
    }],
    axisY: {
        titleFontSize: 12,
        includeZero: true
    },
    data: [{
        type: "line",
        color: "#5abcd8",
        markerSize: 8,
        yValueFormatString: "#.### mg(Cl2)/L"
    }]
});

function onInputCP() {
    if (codePostal.value) progress.removeAttribute("value");
    else progress.setAttribute("value", 0);
    let invalidCP = !codePostal.checkValidity();
    communes.disabled = invalidCP;
    reseaux.disabled = invalidCP;
    params.disabled = invalidCP;
    if (codePostal.value) codePostal.setAttribute("aria-invalid", invalidCP);
    else codePostal.removeAttribute("aria-invalid");
    if (invalidCP) {
        communes.innerHTML = "";
        reseaux.innerHTML = "";
        params.innerHTML = "";
        chartContainer.classList.add("hidden");
        return;
    }
    updateCommunes();
}
function updateCommunes() {
    communes.innerHTML = "";
    fetch(`${APICARTO}/codes-postaux/communes/${codePostal.value}`)
        .then(res => res.json())
        .then(json => {
            console.log("communes")
            console.log(json)
            json.forEach(o => {
                let opt = document.createElement("option");
                opt.text = o.nomCommune;
                opt.value = o.codeCommune;
                communes.add(opt);
            });
        })
        .then(updateReseaux)
        .catch(error => {
            throw (error);
        });
}
function updateReseaux() {
    reseaux.innerHTML = "";
    fetch(`${HUBEAUAPI}/communes_udi?code_commune=${codeCommune()}`)
        .then(res => res.json())
        .then(json => {
            console.log("reseaux")
            console.log(json.data)
            let codes = [];
            for (let entry of json.data) {
                if (codes.includes(entry.code_reseau)) continue;
                let opt = document.createElement("option");
                opt.text = entry.nom_reseau;
                opt.value = entry.code_reseau;
                reseaux.add(opt);
                codes.push(entry.code_reseau)
            }
        })
        .then(updateData)
        .catch(error => {
            throw (error);
        });
}
function updateData() {
    fetch(`${HUBEAUAPI}/resultats_dis?code_commune=${codeCommune()}&code_reseau=${codeReseau()}`)
        .then(res => res.json())
        .then(json => {
            data = json.data
            console.log("data");
            console.log(data);
            progress.setAttribute("value", 100);
            chartContainer.classList.remove("hidden");
        })
        .then(updateParams)
        .then(updateChart)
        .catch(error => {
            throw (error);
        });
}
function updateParams() {
    let currentvalue = params.value ? params.options[params.selectedIndex].value : 1302;
    params.innerHTML = "";
    let used = [];
    let sorted = data.sort((a, b) => a.libelle_parametre.toLowerCase().localeCompare(b.libelle_parametre.toLowerCase()))

    for (let entry of sorted) {
        if (used.includes(entry.libelle_parametre)) continue;
        if (data.filter(d => d.libelle_parametre == entry.libelle_parametre).length < 10) continue;
        let opt = document.createElement("option");
        opt.text = entry.libelle_parametre;
        opt.value = entry.code_parametre;
        params.add(opt);
        used.push(entry.libelle_parametre);
    }
    params.value = currentvalue;
}
function updateChart() {
    if (!params.value) return;
    let dataPoints = paramData(data, parameter());
    chart.options.title.text = parameter();
    chart.options.subtitles[0].text = infos.minmax || "";
    chart.options.axisY.title = infos.unit;
    chart.options.axisY.maximum = null;
    chart.options.axisY.stripLines = [];
    if (infos.minmax) {
        chart.options.axisY.maximum = Math.max(...dataPoints.map(d => d.y), infos.max, 0.5) * 1.5;
        chart.options.axisY.stripLines = [{
            startValue: infos.min || 0,
            endValue: infos.max,
            color: "#d8d8d8"
        }];
    }
    chart.options.data[0].dataPoints = dataPoints;
    chart.render();
}
function paramData(data, param) {
    let filtered = data.filter(x => x.libelle_parametre == param);
    infos = {};
    infos.unit = filtered[0].libelle_unite;
    infos.minmax = filtered[0].reference_qualite_parametre;
    if (infos.min == null && infos.minmax != null) {
        let minmax = infos.minmax.match(/(>=?([0-9,]+).*)?<=?([0-9,]+)/)
        if (minmax) {
            minmax = minmax.map(s => parseFloat(s))
            infos.min = minmax[2] || 0
            infos.max = minmax[3]
        }
    }
    let dp = [];
    filtered.forEach(entry => {
        let val = entry.resultat_numerique;
        let color;
        if (entry.code_unite == "X") {
            color = entry.resultat_numerique == 0 ? "#5abcd8" : "red";
        } else {
            color = (infos.min == null || val >= infos.min) && (infos.max == null || val <= infos.max) ? "#5abcd8" : "red";
        }
        dp.push({
            x: new Date(entry.date_prelevement),
            y: entry.resultat_numerique,
            color: color
        });
    });
    return dp;
}