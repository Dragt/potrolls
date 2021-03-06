// ==UserScript==
// @name potrolls
// @namespace Violentmonkey Scripts
// @include */mountyhall/View/PJView_Events.php*
// @include */mountyhall/MH_Play/Play_ev*
// @grant none
// @version 1.3
// ==/UserScript==


// v1.3
// enregistre localement les événements pour ne pas devoir tout recharger
// 

// v1.2
// ajout de potrolls dans les fenêtres d'événements, avec notamment recherche d'un troll par nom
// corection petit bug de récupération du nom sur certains profils

// attention, pas forcément parfait : de petites errurs non visibles peuvent parfois survenir avec certains profils


/* Pas nécessaire, déjà connu
// @require     https://games.mountyhall.com/mountyhall/JavaScripts/jquery/js/jquery.js
// @require     https://games.mountyhall.com/mountyhall/JavaScripts/jquery/js/jquery-ui-autocomplete.min.js
// @require     https://games.mountyhall.com/mountyhall/JavaScripts/jquery/js/jquery.tagsinput.js
*/


/* 
 * Play_evenement 
 * Play_ev_chasse
 * Play_ev_honte
 * */

const FENETRE_EVENEMENTS = window.location.pathname === '/mountyhall/View/PJView_Events.php';

function ajouterPotrollsFenetreEvenements() {
  
  // Il n'y a la recherche auto sur nom de troll que dans les fenêtres dévénements. MH refuse à partir d'ailleurs que ce qui est défini;
  $("head").append ('<link href="https://games.mountyhall.com/mountyhall/JavaScripts/jquery/css/jquery-ui.autocomplete.css" rel="stylesheet" type="text/css">');
  $("head").append ('<link href="https://games.mountyhall.com/mountyhall/JavaScripts/jquery/css/jquery.tagsinput.css" rel="stylesheet" type="text/css">');

  let bouton = document.createElement("button");
  bouton.addEventListener('click', afficherPotrollsFenetreEvenements);
  bouton.innerText = "Potrolls";
  
  // TODO : probleme en fonction des versions des css de profils, analyser et faire mieux
  if (document.querySelector('.mh_titre1')) document.querySelector('.mh_titre1').appendChild(bouton);
  else  document.querySelector('h1').appendChild(bouton);
}

function afficherPotrollsFenetreEvenements() {
  document.querySelector('body').innerHTML = '';
  initialiserPage();
}



function ajouterPotrollsInterface() {
  let bouton = document.createElement("li");
  bouton.setAttribute('data-wrapperels', 'span');  
  bouton.setAttribute('data-iconshadow', 'true');  
  bouton.setAttribute('data-shadow', 'true');  
  bouton.setAttribute('data-corners', 'true');
  let lien = document.createElement("a");
  lien.appendChild(document.createTextNode('Potrolls'));
  lien.setAttribute('target', '_blank');
  //lien.setAttribute('href', 'https://dragt.github.io/potrolls/');
  lien.addEventListener('click', afficherPotrollsInterface);
  bouton.appendChild(lien);
  document.querySelector('nav#menu-evt ul').appendChild(bouton);
}

function afficherPotrollsInterface() {
  document.querySelector('.mh_tdtitre').innerHTML = '';
  document.querySelector('table.footable').innerHTML = ''
  initialiserPage();
}


let  SELECTEUR_ZONE_A_REMPLIR;

if (FENETRE_EVENEMENTS) {
  SELECTEUR_ZONE_A_REMPLIR = "body";
  ajouterPotrollsFenetreEvenements();
}
else {  
  SELECTEUR_ZONE_A_REMPLIR = '.mh_tdtitre';
  ajouterPotrollsInterface();
}


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
const ID_NOM = 'nom-';
const ID_COMBAT = 'combat-';
const ID_CACHER = 'cacher-';
const ID_SUPPRIMER = 'supprimer-';
const ID_RAFRAICHIR = 'rafraichir-';




let trolls = {};
/* redondance valeur matricule par simplicité
 { matricule: {
 nom:
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

//document.addEventListener('DOMContentLoaded', initialiserPage);

function initialiserPage() {

    ajouterStructure();
    mettreEnFormeStructure();

    recupererSauvegarde();
  
    recupererSauvegardeEvenements(); // v1.3

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
            trolls[troll.matricule].nom = troll.nom;
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
        trollSauvegarde.nom = trolls[matricule].nom;
        trollSauvegarde.couleur = trolls[matricule].couleur;
        trollsSauvegardes.push(trollSauvegarde);
    }

    window.localStorage.setItem('sauvegardePotrolls', JSON.stringify(trollsSauvegardes));
}


// ajouté après, pour ça que les noms des méthodes précédentes pas parfaits, et déroulements pas parfait, pas refactoré
// choix volontaire de garder séparé les trolls/couleurs d'interface et les évènements. Faut que les deux restent cohérents. moyen d'améliorer

 
function recupererSauvegardeEvenements() {
  
    if (window.localStorage.getItem('sauvegardePotrollsEvenements')) {
        const sauvegardeEvenements = JSON.parse(window.localStorage.getItem('sauvegardePotrollsEvenements'));
        for (let matricule in sauvegardeEvenements) {
          if (matricule in trolls) {
            trolls[matricule].evenements = sauvegardeEvenements[matricule];
            trolls[matricule].nombreEvenements = sauvegardeEvenements[matricule].length;
            trolls[matricule].evenements.forEach(x => {
              x.moment = new Date(x.moment); // enregistré en string, reconverti en date
              let tempTr = document.createElement("tr");
              tempTr.innerHTML = x.tr;
              x.tr = tempTr; // converti de string code html vers element
              x.tr.classList.add(CLASS_EVENEMENT + matricule);
              x.tr.querySelector("button").addEventListener('click', supprimerEvenement); // y a mieux comme sélecteur ;)
             trolls[matricule].heureMaj = sauvegardeEvenements[matricule].maj;
            });
          }
        }
      if (window.localStorage.getItem('sauvegardePotrollsEvenementsMaj')) {
         const sauvegardeEvenementsMaj = JSON.parse(window.localStorage.getItem('sauvegardePotrollsEvenementsMaj'));
         for (let matricule in sauvegardeEvenementsMaj) {
           if (matricule in trolls) {
             if (sauvegardeEvenementsMaj[matricule]) {
               trolls[matricule].heureMaj = sauvegardeEvenementsMaj[matricule];
             }
             else {
               trolls[matricule].heureMaj = "";
             }
           }
         }
       }
      
      afficherTrolls(); // pour afficher nombre événements et heureMaj
      afficherEvenements();
    }
}


// TODO : placés sans trop de réflexion, à revoir, il y en a peut-être trop ou pas assez, rechercher : mettreAJourSauvegardeEvenements(); // v1.3
function mettreAJourSauvegardeEvenements() {
  
  let sauvegardeEvenements = {};
  let sauvegardeEvenementsMaj = {}; // par facilité rapidos...
  
  for (let matricule in trolls) {
    sauvegardeEvenements[matricule] = JSON.parse(JSON.stringify(trolls[matricule].evenements)); // deepcopy
    sauvegardeEvenements[matricule].forEach((x, i) => {x.tr = trolls[matricule].evenements[i].tr.innerHTML; });  // enregistre le code html du tr
    
    sauvegardeEvenementsMaj[matricule] = trolls[matricule].heureMaj;
  }
  window.localStorage.setItem('sauvegardePotrollsEvenements', JSON.stringify(sauvegardeEvenements));  
  
  window.localStorage.setItem('sauvegardePotrollsEvenementsMaj', JSON.stringify(sauvegardeEvenementsMaj));
  
  // mettreAJourSauvegarde(); 
  
}



/* ************* partie liste trolls **************** */


function ajouterTroll() {
    const matricule = document.getElementById('nouveauTroll').value;

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
  
    mettreAJourSauvegardeEvenements(); // v1.3

    // mettreAJourSauvegarde(); // bien ici, plutôt mis apprès pour faire tout en une fois avec nom du troll connu
}


function donnerCouleurSuivante() {
    const couleur = COULEURS[couleurSuivante];
    couleurSuivante = (couleurSuivante + 1 ) % COULEURS.length;
    return couleur;
}

function afficherTrolls() {

    const indexTrolls = Object.keys(trolls).sort((x, y) => x - y); // tri sur le matricule

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
    const trTroll = document.createElement("tr");
    trTroll.setAttribute('id', ID_TROLL + matricule);
    trTroll.style.textAlign = 'center'; // css

    const tdMatricule = document.createElement("td");
    tdMatricule.appendChild(document.createTextNode(matricule));
    tdMatricule.style.textAlign = 'center'; // css
    trTroll.appendChild(tdMatricule);

    const tdNom = document.createElement("td");
    tdNom.setAttribute('id', ID_NOM + matricule);
    if (trolls[matricule].nom) tdNom.appendChild(document.createTextNode(trolls[matricule].nom));
    tdNom.style.textAlign = 'center'; // css
    trTroll.appendChild(tdNom);

    const tdCouleur = document.createElement("td");
    const inputCouleur = document.createElement("input");
    inputCouleur.setAttribute('id', ID_COULEUR + matricule);
    inputCouleur.setAttribute('type', 'color');
    inputCouleur.setAttribute('value', trolls[matricule].couleur);
    inputCouleur.addEventListener('change', changerCouleurTroll);
    tdCouleur.appendChild(inputCouleur);
    tdCouleur.style.textAlign = 'center'; // css
    trTroll.appendChild(tdCouleur);
    trolls[matricule].inputCouleur = inputCouleur; // pour accéder directement à sa valeur pou l'enregistrer

    const tdMaj = document.createElement("td");
    tdMaj.appendChild(document.createTextNode(trolls[matricule].heureMaj));
    tdMaj.style.textAlign = 'center'; // css
    trTroll.appendChild(tdMaj);
    trolls[matricule].tdHeureMaj = tdMaj; // pour y accéder directement pour mettre à jour

    const tdRafraichir = document.createElement("td");
    const boutonRafraichir = document.createElement("button");
    boutonRafraichir.appendChild(document.createTextNode('Rafraichir'));
    boutonRafraichir.setAttribute('id', ID_RAFRAICHIR + matricule);
    boutonRafraichir.addEventListener('click', rafraichirTroll);
    tdRafraichir.appendChild(boutonRafraichir);
    tdRafraichir.style.textAlign = 'center'; // css
    trTroll.appendChild(tdRafraichir);

    const tdNombre = document.createElement("td");
    tdNombre.appendChild(document.createTextNode(trolls[matricule].nombreEvenements));
    trTroll.appendChild(tdNombre);
    trolls[matricule].tdNombreEvenements = tdNombre; // pour y accéder directement pour mettre à jour

    const tdCombat = document.createElement("td");
    const checkBoxCombat = document.createElement("input");
    checkBoxCombat.setAttribute('id', ID_COMBAT + matricule);
    checkBoxCombat.setAttribute('type', 'checkbox');
    checkBoxCombat.addEventListener('change', afficherSeulementCombatTroll);
    tdCombat.appendChild(checkBoxCombat);
    tdCombat.style.textAlign = 'center'; // css
    trTroll.appendChild(tdCombat);
    trolls[matricule].checkBoxCombat = checkBoxCombat;
    checkBoxCombat.checked = Boolean(trolls[matricule].combat);

    const tdCacher = document.createElement("td");
    const checkBoxCacher = document.createElement("input");
    checkBoxCacher.setAttribute('id', ID_CACHER + matricule);
    checkBoxCacher.setAttribute('type', 'checkbox');
    checkBoxCacher.addEventListener('change', cacherEvenementsTroll);
    tdCacher.appendChild(checkBoxCacher);
    tdCacher.style.textAlign = 'center'; // css
    trTroll.appendChild(tdCacher);
    trolls[matricule].checkBoxCacher = checkBoxCacher;
    checkBoxCacher.checked = Boolean(trolls[matricule].cacher);

    const tdSupprimer = document.createElement("td");
    const boutonSupprimer = document.createElement("button");
    boutonSupprimer.setAttribute('id', ID_SUPPRIMER + matricule);
    boutonSupprimer.appendChild(document.createTextNode('Supprimer'));
    boutonSupprimer.addEventListener('click', supprimerTroll);
    tdSupprimer.appendChild(boutonSupprimer);
    tdSupprimer.style.textAlign = 'center'; // css
    trTroll.appendChild(tdSupprimer);

    return trTroll;
}

function rafraichirTroll() {
    const matricule = this.id.replace(ID_RAFRAICHIR, '');
    chargerEvenementsTroll(matricule);
    mettreAJourSauvegardeEvenements(); // v1.3
}

function changerCouleurTroll() {
    const matricule = this.id.replace(ID_COULEUR, '');
    trolls[matricule].couleur = this.value;
    afficherEvenements();
    mettreAJourSauvegarde();
}

function afficherSeulementCombatTroll() {
    const matricule = this.id.replace(ID_COMBAT, '');
    trolls[matricule].combat = Number(trolls[matricule].checkBoxCombat.checked);
    afficherEvenements();
    changerNombreEvenements(matricule);
    mettreAJourSauvegardeEvenements(); // v1.3
}

function cacherEvenementsTroll() {
    const matricule = this.id.replace(ID_CACHER, '');
    trolls[matricule].cacher = Number(trolls[matricule].checkBoxCacher.checked);
    afficherEvenements();
    changerNombreEvenements(matricule);
    mettreAJourSauvegardeEvenements(); // v1.3
}

function supprimerTroll() {
    const matricule = this.id.replace(ID_SUPPRIMER, '');
    delete trolls[matricule];
    afficherTrolls();
    afficherEvenements();
    mettreAJourSauvegarde();
    mettreAJourSauvegardeEvenements(); // v1.3
}

function supprimerTousLesTrolls () {
    for (let matricule in trolls) {
        delete trolls[matricule];
    }
    afficherTrolls();
    afficherEvenements();
    mettreAJourSauvegarde();
    mettreAJourSauvegardeEvenements(); // v1.3
}

/* ************* partie affichage evenements **************** */

function rafraichirEvenementsDeTousLesTrolls() {
    for (let matricule in trolls) {
        chargerEvenementsTroll(matricule);
    }
}

function afficherEvenements() {

    const tousEvements = recupererTousEvenements();

    tousEvements.sort((x, y) => y.moment.getTime() - x.moment.getTime() ); // tri sur le moment de l'évènement

    const tableEvenements = document.createElement("table");
    for (let e of tousEvements)
    {
        tableEvenements.appendChild(e.tr);
    }
    document.getElementById('listeEvenements').innerHTML = ''; // Inutile... pourquoi ?
    document.getElementById('listeEvenements').appendChild(tableEvenements);

    colorier();
    reparerLiens();
    mettreCouleursEvenements();

    mettreAJourSauvegarde(); // un peu dommage fait à chaque fois ?
    mettreAJourSauvegardeEvenements(); // v1.3
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
        const xhr = new XMLHttpRequest();
        const url = `${serveur}${service}?${numTroll}=${matricule}&${numPage}=1`;
        xhr.open('get', url, true);
        xhr.onload = callBackAppelerEvenements.bind(xhr, matricule);
        xhr.send();
    }

    function callBackAppelerEvenements(matricule) {
        const heureRetour = new Date();
        const reponseHtml = this.responseText;

        supprimerEvenements(matricule);
        ajouterEvenements(reponseHtml, matricule);
        afficherEvenements();
        changerHeureMaj(matricule, heureRetour.toLocaleTimeString());
        changerNombreEvenements(matricule);
    }

    function ajouterEvenements(pageHtMLEvenements, matricule) {
        const evenementsTroll = convertirVersEvenements(pageHtMLEvenements, matricule)
        trolls[matricule].evenements = trolls[matricule].evenements.concat(evenementsTroll);
        mettreAJourSauvegardeEvenements(); // v1.3
    }

    function convertirVersEvenements(pageHtMLEvenements, matricule) {
        const evenementsTroll = []
        const nodePageEvenements = document.createElement("div");
        nodePageEvenements.innerHTML = pageHtMLEvenements;
        //let evenementsTroll = [];

        // Afficher le nom du troll
        let contenantDuNom = nodePageEvenements.querySelector('.mh_titre1');
      
        trolls[matricule].nom = contenantDuNom ? contenantDuNom.innerHTML : nodePageEvenements.querySelector('h1').innerHTML;
        document.getElementById(ID_NOM + matricule).innerHTML = trolls[matricule].nom;

        const trEvenements = nodePageEvenements.querySelectorAll('table.footable tbody tr, table#events tbody tr'); // todo : trouver un truc sûr pour recupérer tr
        if (trEvenements.length == 0) {alert("Il faut être connecté à MountyHall et le matricule doit être correct"); return;}
        for (let tr of trEvenements) {
            let tableauTd = tr.querySelectorAll('td');
            let evenementTroll = {};
            evenementTroll.matricule = matricule;
            evenementTroll.moment = convertirDateMhVersJs(tableauTd[0].innerHTML);
            evenementTroll.type = tableauTd[1].innerHTML;
            evenementTroll.cacher = 0;
            tr.classList.add(CLASS_EVENEMENT + matricule);


            const boutonSupprimerEvenement = document.createElement("button");
            boutonSupprimerEvenement.setAttribute('data-matricule', matricule); // +id evenement ?
            boutonSupprimerEvenement.setAttribute('title', 'Supprime cette ligne d\'évènement');
            boutonSupprimerEvenement.appendChild(document.createTextNode('X'));
            boutonSupprimerEvenement.addEventListener('click', supprimerEvenement);

            const tdSupprimerEvenement = document.createElement("td");
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
    const matricule = this.getAttribute('data-matricule');
    const tr = this.parentNode.parentNode; // button td tr table
    tr.parentNode.removeChild(tr);
    const i = trolls[matricule].evenements.map(x => x.tr).indexOf(tr);
    if (i > -1) { // devrait l'être
        trolls[matricule].evenements.splice(i, 1);
        changerNombreEvenements(matricule);
    }
    mettreAJourSauvegardeEvenements(); // v1.3
}

function supprimerEvenements(matricule) {
    trolls[matricule].evenements = [];
    mettreAJourSauvegardeEvenements(); // v1.3
}

function changerHeureMaj(matricule, heure) {
    trolls[matricule].heureMaj = heure;
    trolls[matricule].tdHeureMaj.innerHTML = heure;
    mettreAJourSauvegardeEvenements(); // v1.3
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
    mettreAJourSauvegardeEvenements(); // v1.3
}

function colorier() {
  
    for (let matricule in trolls) {
        for (let e of document.querySelector(SELECTEUR_ZONE_A_REMPLIR).querySelectorAll("#" + ID_TROLL + matricule + ', ' + "." + CLASS_EVENEMENT + matricule)) {
            e.classList.remove('mh_tdpage');
            e.style.backgroundColor = trolls[matricule].inputCouleur.value + "88";
        }
    }
}

/* ********** conversion dates ************ */

function convertirDateMhVersJs(dateMh) {
    const arrayDateHeure = dateMh.split(' ');
    const arrayJourMoisAn = arrayDateHeure[0].split('/');
    const dateJs =  new Date(`${arrayJourMoisAn[2]}-${arrayJourMoisAn[1]}-${arrayJourMoisAn[0]} ${arrayDateHeure[1]}`);
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
        else if (a.href.includes('/mountyhall/View/PJView.php?ai_IDPJ=') && (!(a.href.includes('https://games.mountyhall.com')))) { // troll
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
        else if (a.href.includes('/mountyhall/View/MonsterView?ai_IDPJ=') && (!(a.href.includes('https://games.mountyhall.com')))) { // troll
            a.target = "_blank";
            matricule = a.href.split("=")[1];
            a.href = "https://games.mountyhall.com/mountyhall/View/MonsterView.php?ai_IDPJ=" + matricule;
        }
    }
}

/* ********** Remplacer css ************ */
// l'idée ici est de faire absolument tout via js
// étant donné que tout n'est pas reconstruit, pas possible de l'injecter à la création

const COULEUR_MONSTRE = 'red';
const COULEUR_TROLL = 'blue';

function mettreEnFormeStructure() {
    regrouperChamps();
    espacerParties(); // utile ?
}

function mettreCouleursEvenements() {
    colorierMonstres();
    colorierTrolls();
}

function colorierMonstres() {
    for (let e of document.querySelectorAll('.mh_monstres')) {
        e.style.color = COULEUR_MONSTRE;
    }
}

function colorierTrolls() {
    for (let e of document.querySelectorAll('.mh_trolls_1')) {
        e.style.color = COULEUR_TROLL;
    }
}

function regrouperChamps() {
    for (let e of document.querySelectorAll('.ensemble')) {
        e.style.whiteSpace = 'nowrap';
    }
}

function espacerParties() {
    for (let e of document.querySelectorAll('.partie')) {
        e.style.margin = '2vmin';
    }
}

/* *********** Remplacer html **************** */

function ajouterStructure() {

    const zone = document.querySelector(SELECTEUR_ZONE_A_REMPLIR);

    let htmlInputMatricule = "";
  
  /* pas nécessaire, déjà connu
   <script type="text/javascript" src="/mountyhall/JavaScripts/jquery/js/jquery.js"></script>
  <script type="text/javascript" src="/mountyhall/JavaScripts/jquery/js/jquery-ui-autocomplete.min.js"></script>
  <link rel="stylesheet" type="text/css" href="/mountyhall/JavaScripts/jquery/css/jquery-ui.autocomplete.css">
  <script type="text/javascript" src="/mountyhall/JavaScripts/jquery/js/jquery.tagsinput.js"></script>
  <link rel="stylesheet" type="text/css" href="/mountyhall/JavaScripts/jquery/css/jquery.tagsinput.css">
  */
  
    if (window.jQuery) { 
      htmlInputMatricule = `
  <input type="text" name="ai_TrollId" id="nouveauTroll" value="${FENETRE_EVENEMENTS ? new URLSearchParams(window.location.search).get('ai_IDPJ') : ''}" class="ui-autocomplete-input" autocomplete="off">`;

    } else {
      htmlInputMatricule = '<input id="nouveauTroll" type="number" min="0" max="999999" step="1" >';
      
    }
  


    zone.innerHTML = `${ FENETRE_EVENEMENTS ? '<br><div><button onclick="document.location.reload(true);"> &lt;&lt; Retourner aux événements du troll</button></div>' : ''}
<div id="interface" class="partie">
  <div><p><strong>Chaque rafraichissement fait appel au serveur. Merci d'utiliser l'outil de manière responsable.</strong></p></div>
  <div>
    <span class="ensemble">
      <label for="nouveauTroll">Ajouter un troll (numéro) :</label>
      ${htmlInputMatricule}
      <button id="ajouterTroll">Ajouter</button>
    </span>
  </div>
</div>
<div id="trolls" class="partie">
  <table>
    <thead>
    <tr>
      <th>Matricule</th>
      <th>Nom</th>
      <th>Couleur</th>
      <th>Màj</th>
      <th>
        <button id="boutonRafraichirTous">Tous(!)</button>
      </th>
      <th>Nombre</th>
      <th>Combat</th>
      <th>Cacher</th>
      <th>
        <button id="boutonSupprimerTous">Tous(!)</button>
      </th>
    </tr>
    </thead>
    <tbody id="listeTrolls">
    </tbody>
  </table>
</div>
<div id="evenements" class="partie">
  <strong>Evenements des trolls</strong>
  <div id="listeEvenements">
  </div>
</div>`;
  
  
   if (window.jQuery) {
     //console.log("y a JQuery");
    $("#nouveauTroll").autocomplete({source: '/mountyhall/MH_PageUtils/Services/json_trolls.php', minLength: 2});
  } else {
      //console.log("y a pas");
  }

}
