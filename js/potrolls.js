"use strict";

/* ********** globales et constantes ************ */

const serveur = 'https://games.mountyhall.com';
const service = '/mountyhall/View/PJView_Events.php';
const numPage = "ai_PageNum";
const numTroll = "ai_IDPJ";
const COULEURS = ["#c0d3a0", "#d5effd", "#fee7f0", "#dccb99", "#fef86c", "#ddd2e6", "#cecece", "#ffe06b", "#a66ca0", "#ccc93d", "#fc5d5d"];
let couleurSuivante = 0;
const MAX_TROLLS = 8;

const ID_TROLL = 'troll-';
const CLASS_EVENEMENT = 'evenement-';
const CLASS_TROLL = 'etroll-';
const ID_COULEUR = 'couleur-';
const ID_COMBAT = 'combat-';
const ID_CACHER = 'cacher-';
const ID_SUPPRIMER = 'supprimer-';
const ID_RAFRAICHIR = 'rafraichir-';


let trolls = {};
/* redondance valeur matricule par simplicité
{ matricule: {
    couleur:,
    inputCouleur: ,
    tdNombreEvenements: ,
    heureMaj;
    tdHeureMaj: ,
    combat: ,
    checkBoxCombat: ,
    cacher: ,
    checkBoxCacher: ,
    evenements : [{matricule: , moment: , type: , cacher:, tr:  }, ...]
}}
*/

let trollsSauvegardes = [];
/* [ {matricule: , couleur: }, ...] */



/* ********** initialisation ************ */

document.addEventListener('DOMContentLoaded', initialiserPage);

function initialiserPage() {

    recupererSauvegarde();

    document.getElementById('boutonRafraichirTous').addEventListener('click', rafraichirEvenementsDeTousLesTrolls);
    document.getElementById('boutonSupprimerTous').addEventListener('click', supprimerTousLesTrolls);
    document.getElementById('ajouterTroll').addEventListener('click', ajouterTroll);
}


/* ********** sauvegarde trolls ************ */

function recupererSauvegarde() {
    if (window.localStorage.getItem('sauvegardePotrolls')) {
        trollsSauvegardes = JSON.parse(window.localStorage.getItem('sauvegardePotrolls'));

        for (let troll of trollsSauvegardes) {
            trolls[troll.matricule] = {};
            trolls[troll.matricule].couleur = troll.couleur;
            trolls[troll.matricule].heureMaj = '';
            trolls[troll.matricule].nombreEvenements = 0;
            trolls[troll.matricule].evenements = [];
        }

        afficherTrolls();
        colorier();
    }
}
function mettreAJourSauvegarde() {
    trollsSauvegardes = [];

    for (let matricule in trolls) {
        let trollSauvegarde = {};
        trollSauvegarde.matricule = matricule;
        trollSauvegarde.couleur = trolls[matricule].couleur;
        trollsSauvegardes.push(trollSauvegarde);
    }

    window.localStorage.setItem('sauvegardePotrolls', JSON.stringify(trollsSauvegardes));
}


/* ************* partie liste trolls **************** */


function ajouterTroll() {
    let matricule = document.getElementById('nouveauTroll').value;

    if (Object.keys(trolls).length >= MAX_TROLLS) {alert('Maximum ' + MAX_TROLLS + ' trolls.'); return;} // limite pour le moment pour éviter les abus ?

    if (matricule in trolls) return; // déjà présent

    trolls[matricule] = {};
    trolls[matricule].couleur = donnerCouleurSuivante();
    trolls[matricule].heureMaj = '';
    trolls[matricule].nombreEvenements = '';
    trolls[matricule].combat = Boolean(trolls[matricule].combat);
    trolls[matricule].cacher = Boolean(trolls[matricule].cacher);

    // pour le moment on recrée tout le tableau et on le ré-affiche, bourrin mais simple et local
    afficherTrolls();
    chargerEvenementsTroll(matricule);

    mettreAJourSauvegarde();
}

function donnerCouleurSuivante() {
    let couleur = COULEURS[couleurSuivante];
    couleurSuivante = (couleurSuivante + 1 ) % COULEURS.length;
    return couleur;
}

function afficherTrolls() {

    let indexTrolls = Object.keys(trolls).sort((x, y) => x - y); // tri sur le matricule

    let listeTrollsDocumentFragment = document.createDocumentFragment();
    for (let matricule of indexTrolls) {
        let trTroll = creerTrTroll(matricule);
        listeTrollsDocumentFragment.appendChild(trTroll);
    }

    document.getElementById('listeTrolls').innerHTML = '';
    document.getElementById('listeTrolls').appendChild(listeTrollsDocumentFragment);

}


function creerTrTroll(matricule) {

    // J'ai une fonction générique pour créer des évènements par paramètres... mais ça s'exécute un chouia moins vite. :)
    let trTroll = document.createElement("tr");
    trTroll.setAttribute('id', ID_TROLL + matricule);

    let tdMatricule = document.createElement("td");
    tdMatricule.appendChild(document.createTextNode(matricule));
    trTroll.appendChild(tdMatricule);

    let tdCouleur = document.createElement("td");
    let inputCouleur = document.createElement("input");
    inputCouleur.setAttribute('id', ID_COULEUR + matricule);
    inputCouleur.setAttribute('type', 'color');
    inputCouleur.setAttribute('value', trolls[matricule].couleur);
    inputCouleur.addEventListener('change', changerCouleurTroll);
    tdCouleur.appendChild(inputCouleur);
    trTroll.appendChild(tdCouleur);
    trolls[matricule].inputCouleur = inputCouleur; // pour accéder directement à sa valeur pou l'enregistrer

    let tdMaj = document.createElement("td");
    tdMaj.appendChild(document.createTextNode(trolls[matricule].heureMaj));
    trTroll.appendChild(tdMaj);
    trolls[matricule].tdHeureMaj = tdMaj; // pour y accéder directement pour mettre à jour

    let tdRafraichir = document.createElement("td");
    let boutonRafraichir = document.createElement("button");
    boutonRafraichir.appendChild(document.createTextNode('Rafraichir'));
    boutonRafraichir.setAttribute('id', ID_RAFRAICHIR + matricule);
    boutonRafraichir.addEventListener('click', rafraichirTroll);
    tdRafraichir.appendChild(boutonRafraichir);
    trTroll.appendChild(tdRafraichir);

    let tdNombre = document.createElement("td");
    tdNombre.appendChild(document.createTextNode(trolls[matricule].nombreEvenements));
    trTroll.appendChild(tdNombre);
    trolls[matricule].tdNombreEvenements = tdNombre; // pour y accéder directement pour mettre à jour

    let tdCombat = document.createElement("td");
    let checkBoxCombat = document.createElement("input");
    checkBoxCombat.setAttribute('id', ID_COMBAT + matricule);
    checkBoxCombat.setAttribute('type', 'checkbox');
    checkBoxCombat.addEventListener('change', afficherSeulementCombatTroll);
    tdCombat.appendChild(checkBoxCombat);
    trTroll.appendChild(tdCombat);
    trolls[matricule].checkBoxCombat = checkBoxCombat;
    checkBoxCombat.checked = Boolean(trolls[matricule].combat);

    let tdCacher = document.createElement("td");
    let checkBoxCacher = document.createElement("input");
    checkBoxCacher.setAttribute('id', ID_CACHER + matricule);
    checkBoxCacher.setAttribute('type', 'checkbox');
    checkBoxCacher.addEventListener('change', cacherEvenementsTroll);
    tdCacher.appendChild(checkBoxCacher);
    trTroll.appendChild(tdCacher);
    trolls[matricule].checkBoxCacher = checkBoxCacher;
    checkBoxCacher.checked = Boolean(trolls[matricule].cacher);

    let tdSupprimer = document.createElement("td");
    let boutonSupprimer = document.createElement("button");
    boutonSupprimer.setAttribute('id', ID_SUPPRIMER + matricule);
    boutonSupprimer.appendChild(document.createTextNode('Supprimer'));
    boutonSupprimer.addEventListener('click', supprimerTroll);
    tdSupprimer.appendChild(boutonSupprimer);
    trTroll.appendChild(tdSupprimer);

    return trTroll;
}

function rafraichirTroll() {
    let matricule = this.id.replace(ID_RAFRAICHIR, '');
    chargerEvenementsTroll(matricule);
}

function changerCouleurTroll() {
    let matricule = this.id.replace(ID_COULEUR, '');
    trolls[matricule].couleur = this.value;
    afficherEvenements();
    mettreAJourSauvegarde();
}

function afficherSeulementCombatTroll() {
    let matricule = this.id.replace(ID_COMBAT, '');
    trolls[matricule].combat = Number(trolls[matricule].checkBoxCombat.checked);
    afficherEvenements();
    changerNombreEvenements(matricule);
}

function cacherEvenementsTroll() {
    let matricule = this.id.replace(ID_CACHER, '');
    trolls[matricule].cacher = Number(trolls[matricule].checkBoxCacher.checked);
    afficherEvenements();
    changerNombreEvenements(matricule);
}

function supprimerTroll() {
    let matricule = this.id.replace(ID_SUPPRIMER, '');
    delete trolls[matricule];
    afficherTrolls();
    afficherEvenements();
    mettreAJourSauvegarde();
}

function supprimerTousLesTrolls () {
    for (let matricule in trolls) {
        delete trolls[matricule];
    }
    afficherTrolls();
    afficherEvenements();
}

/* ************* partie affichage evenements **************** */

function rafraichirEvenementsDeTousLesTrolls() {
    for (let matricule in trolls) {
        chargerEvenementsTroll(matricule);
    }
}

function afficherEvenements() {

    let tousEvements = recupererTousEvenements();

    tousEvements.sort((x, y) => y.moment.getTime() - x.moment.getTime() ); // tri sur le moment de l'évènement

    let tableEvenements = document.createElement("table");
    for (let e of tousEvements)
    {
        tableEvenements.appendChild(e.tr);
    }
    document.getElementById('listeEvenements').innerHTML = ''; // Inutile... pourquoi ?
    document.getElementById('listeEvenements').appendChild(tableEvenements);

    colorier();
    reparerLiens();
}

function recupererTousEvenements() {
    let tousEvenements = [];
    for (let matricule in trolls) {
        if (!(trolls[matricule].checkBoxCacher.checked)) {
            let evenementsFiltres = trolls[matricule].evenements.slice();
            if (trolls[matricule].checkBoxCombat.checked) {
                evenementsFiltres = evenementsFiltres.filter(x => x.type === 'COMBAT');
            }
            tousEvenements = tousEvenements.concat(evenementsFiltres);
         }
    }
    return tousEvenements;
}



function chargerEvenementsTroll(matricule) {

    appelerEvenements(matricule);

    function appelerEvenements(matricule) {
        let xhr = new XMLHttpRequest();
        let url = `${serveur}${service}?${numTroll}=${matricule}&${numPage}=1`;
        xhr.open('get', url, true);
        xhr.onload = callBackAppelerEvenements.bind(xhr, matricule);
        xhr.send();
    }

    function callBackAppelerEvenements(matricule) {
        let heureRetour = new Date();
        let reponseHtml = this.responseText;

        supprimerEvenements(matricule);
        ajouterEvenements(reponseHtml, matricule);
        afficherEvenements();
        changerHeureMaj(matricule, heureRetour.toLocaleTimeString());
        changerNombreEvenements(matricule);
    }

    function ajouterEvenements(pageHtMLEvenements, matricule) {
        let evenementsTroll = convertirVersEvenements(pageHtMLEvenements, matricule)
        trolls[matricule].evenements = trolls[matricule].evenements.concat(evenementsTroll);
    }

    function convertirVersEvenements(pageHtMLEvenements, matricule) {
        let evenementsTroll = []
        let nodePageEvenements = document.createElement("div");
        nodePageEvenements.innerHTML = pageHtMLEvenements;
        //let evenementsTroll = [];
        let trEvenements = nodePageEvenements.querySelectorAll('table.footable tbody tr');
        if (trEvenements.length == 0) {alert("Il faut être connecté à MountyHall et le matricule doit être correct"); return;}
        for (let tr of trEvenements) {
            let tableauTd = tr.querySelectorAll('td');
            let evenementTroll = {};
            evenementTroll.matricule = matricule;
            evenementTroll.moment = convertirDateMhVersJs(tableauTd[0].innerHTML);
            evenementTroll.type = tableauTd[1].innerHTML;
            evenementTroll.cacher = 0;
            tr.classList.add(CLASS_EVENEMENT + matricule);


            let boutonSupprimerEvenement = document.createElement("button");
            boutonSupprimerEvenement.setAttribute('data-matricule', matricule); // +id evenement ?
            boutonSupprimerEvenement.setAttribute('title', 'Supprime cette ligne d\'évènement');
            boutonSupprimerEvenement.appendChild(document.createTextNode('X'));
            boutonSupprimerEvenement.addEventListener('click', supprimerEvenement);

            let tdSupprimerEvenement = document.createElement("td");
            tdSupprimerEvenement.appendChild(boutonSupprimerEvenement);
            tr.insertBefore(tdSupprimerEvenement, tr.firstChild);
            //tr.insertAdjacentHTML('afterbegin', ),;

            evenementTroll.tr = tr;

            evenementsTroll.push(evenementTroll);
        }

        return evenementsTroll;
    }
}

function supprimerEvenement() {
    let matricule = this.getAttribute('data-matricule');
    let tr = this.parentNode.parentNode; // button td tr table
    tr.parentNode.removeChild(tr);
    let i = trolls[matricule].evenements.map(x => x.tr).indexOf(tr);
    if (i > -1) { // devrait l'être
        trolls[matricule].evenements.splice(i, 1);
        changerNombreEvenements(matricule);
    }
}

function supprimerEvenements(matricule) {
    trolls[matricule].evenements = [];
}

function changerHeureMaj(matricule, heure) {
    trolls[matricule].heureMaj = heure;
    trolls[matricule].tdHeureMaj.innerHTML = heure;
}

function changerNombreEvenements(matricule) {
    let nombre = 0;
    if ( trolls[matricule].cacher == 1) {
        nombre = 0;
    }
    else if ( trolls[matricule].combat == 1) {
        nombre = trolls[matricule].evenements.filter(x => x.type =='COMBAT' ).length;
    }
    else {
        nombre = trolls[matricule].evenements.length;
    }
    trolls[matricule].nombreEvenements = nombre;
    trolls[matricule].tdNombreEvenements.innerHTML = nombre;
}

function colorier() {
    for (let matricule in trolls) {
        for (let e of document.querySelectorAll("#" + ID_TROLL + matricule + ', ' + "." + CLASS_EVENEMENT + matricule)) {
            e.style.backgroundColor = trolls[matricule].inputCouleur.value + "88";
        }
    }
}

/* ********** conversion dates ************ */

function convertirDateMhVersJs(dateMh) {
    let arrayDateHeure = dateMh.split(' ');
    let arrayJourMoisAn = arrayDateHeure[0].split('/');
    let dateJs =  new Date(`${arrayJourMoisAn[2]}-${arrayJourMoisAn[1]}-${arrayJourMoisAn[0]} ${arrayDateHeure[1]}`);
    return dateJs;
}

/* ********** bidouille liens ************ */


function reparerLiens() {

    for (let a of document.querySelectorAll('#listeEvenements a.mh_trolls_1')) {
        let matricule = '';
        if ( a.href.includes('javascript:EPV') ) { //monstre
            a.target = "_blank";
            matricule = a.href.split("'")[1];

            a.href = "https://games.mountyhall.com/mountyhall/View/PJView_Events.php?ai_IDPJ=" + matricule;
        }
        else if (a.href.includes('/mountyhall/View/PJView.php?ai_IDPJ=') || (!(a.href.includes('https://games.mountyhall.com')))) { // troll
            a.target = "_blank";
            matricule = a.href.split("=")[1];
            a.href = "https://games.mountyhall.com/mountyhall/View/PJView_Events.php?ai_IDPJ=" + matricule;
        }
    }

    for (let a of document.querySelectorAll('#listeEvenements a.mh_monstres')) {

        let matricule = "";
        if ( a.href.includes('javascript:EMV')  ) { //monstre
            a.target = "_blank";
            matricule = a.href.split("'")[1];
            a.href = "https://games.mountyhall.com/mountyhall/View/MonsterView.php?ai_IDPJ=" + matricule;
        }
        else if (a.href.includes('/mountyhall/View/MonsterView?ai_IDPJ=') || (!(a.href.includes('https://games.mountyhall.com')))) { // troll
            a.target = "_blank";
            matricule = a.href.split("=")[1];
           a.href = "https://games.mountyhall.com/mountyhall/View/MonsterView.php?ai_IDPJ=" + matricule;
        }
    }
}

