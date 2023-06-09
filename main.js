const APICARTO = "https://apicarto.ign.fr/api";
const HUBEAUAPI = "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable";

const codePostal = document.querySelector("#code_postal");
const communes = document.querySelector("#communes");
const reseaux = document.querySelector("#reseaux");
const params = document.querySelector("#paramSelect");
const progress = document.querySelector("progress");
const invalidcp = document.querySelector(".invalidcp");
const unknowncp = document.querySelector(".unknowncp");

const chartContainer = document.getElementById('chart');

var inputs = {
    get cp() { return codePostal },
    get commune() { return communes.options[communes.selectedIndex] },
    get reseau() { return reseaux.options[reseaux.selectedIndex] },
    get parameter() { return params.options[params.selectedIndex] },
}

var data = [];
var infos = {};

codePostal.addEventListener("input", onInputCP);
communes.addEventListener("change", updateReseaux);
reseaux.addEventListener("change", updateData);
params.addEventListener("change", () => {
    infos.lastParam = params.value;
    updateChart();
});

luxon.Settings.defaultLocale = "fr";
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
            backgroundColor: '#9CD6E7',
            borderColor: '#5abcd855',
            borderWidth: 2,
            cubicInterpolationMode: 'monotone',
            tension: 0.2,
            pointBorderColor: context => {
                const dset = context.dataset;
                const value = dset.data[context.dataIndex];
                if(dset.dataPoints) {
                    let datapoint = dset.dataPoints[context.dataIndex];
                    if (datapoint.id == "X" && value == 1)
                        return "red";
                }
                if (infos.minmax && (value < infos.min || value > infos.max))
                    return 'red';
                return '#5abcd8';
            }
        }]
    },
    options: {
        animation: false,
        locale: 'fr-FR',
        scales: {
            x: {
                type: 'time'
            },
            y: {
                beginAtreset: true,
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
                    return `Mesures ${inputs.parameter.text}, ${inputs.commune.text}`;
                },
            },
            subtitle: {
                display: true,
                text: () => {
                    if(!data.length) return;
                    return [
                        `Réseau ${inputs.reseau.text}`,
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
            },
            zoom: {
                pan: {
                  enabled: true,
                  mode: 'xy',
                },
                zoom: {
                  wheel: {
                    enabled: true,
                  },
                  pinch: {
                    enabled: true,
                  },
                  mode: 'x',
                }
            }
        }
    }
});

var progressManager = {
    error: () => {
        progress.setAttribute("value", 100)
        progress.classList.add("error")
        progress.classList.remove("valid")
    },
    valid: (value) => {
        progress.setAttribute("value", value)
        progress.classList.add("valid")
        progress.classList.remove("error")
    },
    loading: (value) => {
        progress.removeAttribute("value")
        progress.classList.remove("valid")
        progress.classList.remove("error")
    },
    reset: (value) => {
        progress.setAttribute("value", 0)
        progress.classList.remove("valid")
        progress.classList.remove("error")
    }
}

function onInputCP() {
    unknowncp.hidden = true;
    invalidcp.hidden = true;
    progressManager.reset();

    let trimmedCP = codePostal.value.replaceAll(' ','');
    if (trimmedCP.length) progressManager.loading();

    let isInvalid = !codePostal.checkValidity();
    if (trimmedCP.match(/^\d{0,4}$/)) {
        codePostal.removeAttribute("aria-invalid");
    }
    else {
        codePostal.setAttribute("aria-invalid", isInvalid);
        invalidcp.hidden = !isInvalid;
        if(isInvalid) {
            progressManager.error();
        }
    }
    
    codePostal.value = trimmedCP;
    communes.disabled = true;
    reseaux.disabled = true;
    params.disabled = true;
    communes.innerHTML = "";

    if (isInvalid) {
        communes.innerHTML = "";
        reseaux.innerHTML = "";
        chartContainer.classList.add("hidden");
        return;
    }

    fetchCommunes()
    .then(updateCommunes)
}
function fetchCommunes() {
    return fetch(`${APICARTO}/codes-postaux/communes/${codePostal.value}`)
        .then(res => {
            codePostal.setAttribute("aria-invalid", !res.ok)
            unknowncp.hidden = res.ok;
            if(!res.ok) {
                progressManager.error();
                throw new Error(`${APICARTO} returned ${res.status}`);
            }
            return res;
        })
        .then(res => res.json())
        .catch(error => {
            throw (error);
        });
}
function updateCommunes(json) {
    communes.disabled = false;
    reseaux.disabled = false;
    params.disabled = false;
    // console.log("communes")
    // console.log(json)
    json.forEach(o => {
        let opt = document.createElement("option");
        opt.text = o.nomCommune;
        opt.value = o.libelleAcheminement;
        communes.add(opt);
    });
    updateReseaux();
}
function updateReseaux() {
    reseaux.innerHTML = "";
    let route = `${HUBEAUAPI}/communes_udi?nom_commune=${inputs.commune.value}`;
    console.log(`Fetching... ${route}`);
    fetch(route)
        .then(res => {
            if(!res.ok) {
                progressManager.error();
                throw new Error(`${HUBEAUAPI} returned ${res.status}`);
            }
            return res;
        })
        .then(res => res.json())
        .then(json => {
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
    let route = `${HUBEAUAPI}/resultats_dis?nom_commune=${inputs.commune.value}&code_reseau=${inputs.reseau.value}`;
    console.log(`Fetching... ${route}`);
    fetch(route)
        .then(res => {
            if(!res.ok) {
                progressManager.error();
                throw new Error(`${HUBEAUAPI} returned ${res.status}`);
            }
            progressManager.valid(100);
            return res;
        })
        .then(res => res.json())
        .then(json => {
            data = json.data
        })
        .then(updateParams)
        .catch(error => {
            throw (error);
        });
}
function updateParams() {
    // sort alphabetically by libelle
    let entries = data.sort((a, b) => a.libelle_parametre.toLowerCase().localeCompare(b.libelle_parametre.toLowerCase()))
    // add every option once
    params.innerHTML = "";
    let used = [];
    for (let entry of entries) {
        if (used.includes(entry.libelle_parametre)) continue;
        let opt = document.createElement("option");
        opt.text = entry.libelle_parametre;
        opt.value = entry.code_parametre;
        params.add(opt);
        used.push(entry.libelle_parametre);
    }
    // select previously selected option if possible, or "ph"
    if(infos.lastParam && params.querySelector(`option[value="${infos.lastParam}"]`))
        params.value = infos.lastParam;
    else params.value = 1302;
    updateChart();
}
function updateChart() {
    if (!params.value) return;
    console.log(`Chart param ${inputs.parameter.value}`)
    let dataPoints = paramData(data, inputs.parameter.value);
    chart.data.labels = dataPoints.map(dp => dp.x);
    chart.data.datasets[0].dataPoints = dataPoints;
    chart.data.datasets[0].data = dataPoints.map(dp => dp.y);

    chart.scales.y.title = infos.unit;
    chart.scales.y.max = null;
    chart.scales.y.stripLines = [];

    chartContainer.classList.remove("hidden");
    chart.update();
    chart.resetZoom();
}
function paramData(data, param) {
    let filtered = data.filter(x => x.code_parametre == param);
    infos.datamax = Math.max(...filtered.map(i => i.resultat_numerique));
    infos.unit = filtered[0].libelle_unite;
    infos.minmax = filtered[0].reference_qualite_parametre;
    infos.min = infos.max = null;
    if (infos.minmax != null) {
        let minmax = infos.minmax.match(/(>=?([0-9,]+).*)?<=?([0-9,]+)/)
        if (minmax) {
            minmax = minmax.map(s => parseFloat(s));
            infos.min = minmax[2] || 0;
            infos.max = minmax[3];
        }
    }
    let dp = [];
    for (let entry of filtered) {
        let x = entry.date_prelevement;
        let y = entry.resultat_numerique;
        if(dp.find(o => o.x == x && o.y == y)) continue;
        dp.push({ x: x, y: y, id: entry.code_unite});
    };
    console.log(dp);
    return dp;
}