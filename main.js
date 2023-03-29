const APICARTO = "https://apicarto.ign.fr/api";
const HUBEAUAPI = "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable";

const codePostal = document.querySelector("#code_postal");
const communes = document.querySelector("#communes");
const reseaux = document.querySelector("#reseaux");
const params = document.querySelector("#paramSelect");
const progress = document.querySelector("progress");

const chartContainer = document.getElementById('chart');

codePostal.addEventListener("input", onInputCP);
communes.addEventListener("change", updateReseaux);
reseaux.addEventListener("change", updateData);
params.addEventListener("change", updateChart);

const codeCommune = () => communes.options[communes.selectedIndex].value;
const codeReseau = () => reseaux.options[reseaux.selectedIndex].value;
const parameter = () => params.options[params.selectedIndex].text;
const commune = () => communes.options[communes.selectedIndex].text;
const reseau = () => reseaux.options[reseaux.selectedIndex].text;

var data = [];
var infos = {};

Chart.defaults.font.size = 14;
Chart.defaults.font.lineHeight = 1;
Chart.defaults.font.family = 'system-ui,-apple-system,"Segoe UI","Roboto","Ubuntu","Cantarell","Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"';
var chart = new Chart(chartContainer, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: '',
            data: [],
            borderColor: '#5abcd8',
            borderWidth: 2,
            cubicInterpolationMode: 'monotone',
            tension: 0.2,
            pointBorderColor: context => {
                var value = context.dataset.data[context.dataIndex];
                return value < infos.min || value > infos.max ? 'red' : '#5abcd8';
            }
        }]
    },
    options: {
        animation: false,
        locale: 'fr-FR',
        scales: {
            x: {
                type: 'time',
                time: {
                    tooltipFormat:"'le' dd/MM/yyyy 'à' HH:mm",
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: ctx => infos.unit,
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: () => {
                    if(!data.length) return;
                    return `Mesures ${parameter()}, ${commune()}`;
                },
            },
            subtitle: {
                display: true,
                text: () => {
                    if(!data.length) return;
                    return [
                        `Réseau ${reseau()}`,
                        infos.minmax ? `Norme : ${infos.minmax}` : ''
                    ];
                },
                padding: {
                    top: 0,
                    bottom: 20
                },
            },
            legend:{
                display: false
            },
            tooltip: {
                padding: 14,
                callbacks: {
                    label: (ctx) => `${ctx.formattedValue} ${infos.unit}`,
                },
            },
            annotation: {
                annotations: {
                    reference: {
                        drawTime: 'beforeDatasetsDraw',
                        display: true,
                        type: 'box',
                        yMin: () => infos.min || 0,
                        yMax: () => infos.max,
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        borderWidth: 0,
                    }
                }
            }
        }
    }
});


onInputCP();

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
    chart.data.labels = dataPoints.map(dp => dp.x);
    chart.data.datasets[0].data = dataPoints.map(dp => dp.y);

    chart.scales.y.title = infos.unit;
    chart.scales.y.max = null;
    chart.scales.y.stripLines = [];

    chart.update();
}
function paramData(data, param) {
    let filtered = data.filter(x => x.libelle_parametre == param);
    infos = {};
    infos.datamax = Math.max(...filtered.map(i => i.resultat_numerique));
    infos.unit = filtered[0].libelle_unite;
    infos.minmax = filtered[0].reference_qualite_parametre;
    if (infos.min == null && infos.minmax != null) {
        let minmax = infos.minmax.match(/(>=?([0-9,]+).*)?<=?([0-9,]+)/)
        if (minmax) {
            minmax = minmax.map(s => parseFloat(s));
            infos.min = minmax[2] || 0;
            infos.max = minmax[3];
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