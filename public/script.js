const apiUrl = 'https://ton-projet.railway.app/api';

async function chargerAffaires() {
  const res = await fetch(`${apiUrl}/affaires`);
  const affaires = await res.json();

  const select = document.getElementById('affaireSelect');
  const ul = document.getElementById('listeAffaires');
  select.innerHTML = '';
  ul.innerHTML = '';

  affaires.forEach(a => {
    const option = document.createElement('option');
    option.value = a.id;
    option.textContent = a.nom;
    select.appendChild(option);

    const li = document.createElement('li');
    li.textContent = a.nom;
    ul.appendChild(li);
  });
}

async function chargerChantiers() {
  const res = await fetch(`${apiUrl}/chantiers`);
  const chantiers = await res.json();

  const ul = document.getElementById('listeChantiers');
  ul.innerHTML = '';

  chantiers.forEach(c => {
    const li = document.createElement('li');
    li.textContent = `#${c.numero} - ${c.nom} (Affaire : ${c.affaire_nom || 'Aucune'})`;

    
    li.onclick = () => afficherDetails(c);
    
    ul.appendChild(li);
  }
  
);
}

async function ajouterAffaire() {
  const nom = document.getElementById('nomAffaire').value;
  if (!nom) return;
  await fetch(`${apiUrl}/affaires`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nom })
  });
  document.getElementById('nomAffaire').value = '';
  chargerAffaires();
}

async function ajouterChantier() {
  const nom = document.getElementById('nomChantier').value;
  const affaire_id = document.getElementById('affaireSelect').value;
  const date_reception = document.getElementById('dateReception').value;
  const date_prelevement = document.getElementById('datePrelevement').value;
  const slump = document.getElementById('slump').value;
// inclure slump dans le body du fetch



  if (!nom || !affaire_id) return;

  await fetch(`${apiUrl}/chantiers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nom, affaire_id, date_reception, date_prelevement, slump })
  });

  document.getElementById('nomChantier').value = '';
  document.getElementById('dateReception').value = '';
  document.getElementById('datePrelevement').value = '';
  chargerChantiers();
}

function afficherDetails(chantier) {
  const div = document.getElementById('detailsChantier');
  div.style.display = 'block';
  div.innerHTML = `
    <h3>Détails du chantier</h3>
    <p><strong>Nom :</strong> ${chantier.nom}</p>
    <p><strong>Affaire :</strong> ${chantier.affaire_nom || 'Aucune'}</p>
    <p><strong>Date réception :</strong> ${chantier.date_reception || '-'}</p>
    <p><strong>Date prélèvement :</strong> ${chantier.date_prelevement || '-'}</p>
    <p><strong>Slump :</strong> ${chantier.slump || '—'}</p>
        <h4>Éprouvettes :</h4>
    <ul id="eprouvettesList">Chargement...</ul>
  `;

    fetch(`/api/eprouvettes?chantier_id=${chantier.id}`)
    .then(res => res.json())
    .then(eprouvettes => {
      
      const list = document.getElementById('eprouvettesList');
      if (eprouvettes.length === 0) {
        list.innerHTML = '<li>Aucune éprouvette</li>';
      } else {
        list.innerHTML = '';
        eprouvettes.forEach(ep => {
          const date = chantier.date_prelevement
            ? new Date(new Date(chantier.date_prelevement).getTime() + ep.age_jour * 86400000)
            : 'Date inconnue';
          const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
          const li = document.createElement('li');
          li.textContent = `Éprouvette ${ep.age_jour}j – Écrasement prévu le ${dateStr} - x${ep.nombre}`;
          list.appendChild(li);
        });
      }
    });
}


function showChantierDetails(chantier) {
  const detailsDiv = document.getElementById('chantierDetails');
  detailsDiv.innerHTML = `
    <h3>Détails du chantier</h3>
    <p><strong>Nom :</strong> ${chantier.nom}</p>
    <p><strong>Affaire :</strong> ${chantier.affaire_nom || 'Non associée'}</p>
    <p><strong>Date de réception :</strong> ${chantier.date_reception || '—'}</p>
    <p><strong>Date de prélèvement :</strong> ${chantier.date_prelevement || '—'}</p>
    <h4>Éprouvettes :</h4>
    <ul id="eprouvettesList">Chargement...</ul>
  `;

  fetch(`/api/eprouvettes?chantier_id=${chantier.id}`)
    .then(res => res.json())
    .then(eprouvettes => {
      const list = document.getElementById('eprouvettesList');
      if (eprouvettes.length === 0) {
        list.innerHTML = '<li>Aucune éprouvette</li>';
      } else {
        list.innerHTML = '';
        eprouvettes.forEach(ep => {
          const date = chantier.date_prelevement
            ? new Date(new Date(chantier.date_prelevement).getTime() + ep.age_jour * 86400000)
            : 'Date inconnue';
          const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
          const li = document.createElement('li');
          li.textContent = `Éprouvette ${ep.age_jour}j – Écrasement prévu le ${dateStr}`;
          list.appendChild(li);
        });
      }
    });
}

function loadCalendarEvents() {
   const events = [];
  fetch('/api/chantiers')
    .then(res => res.json())
    .then(chantiers => {
      console.log('chantiers recus :', chantiers);
      chantiers.forEach(c => {
       
            if (c.date_reception) {
              events.push({ title: `Réception: ${c.nom}`, date: c.date_reception, color: 'red' });
            }
            if (c.date_prelevement) {
              events.push({ title: `Prélèvement: ${c.nom}`, date: c.date_prelevement, color: 'orange' });
            }
        fetch(`/api/eprouvettes?chantier_id=${c.id}`)
        .then(res => res.json())
        .then(eprouvettes => {
          console.log('Éprouvettes reçues :', eprouvettes);
          
            eprouvettes.forEach(e => {
            
            
            if (c.date_prelevement) {
              console.log('hello')
              console.log(e)
              const date = new Date(c.date_prelevement);
              date.setDate(date.getDate() + e.age_jour);
              const isoDate = date.toISOString().split('T')[0];
              events.push({
                title: `Éprouvette (${e.age_jour}j) - ${e.chantier_nom}`,
                date: isoDate,
                color: 'blue'
              });
                                 const calendarEl = document.getElementById('calendar');
                const calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'fr',
                events: events
                });
                calendar.render();
            }
          });
          });
          


        });
    });

                
}

function loadChantiersInSelect() {
  fetch('/api/chantiers')
    .then(res => res.json())
    .then(chantiers => {
      const select = document.getElementById('chantierSelect');
      select.innerHTML = '';
      chantiers.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.nom;
        select.appendChild(option);
      });
    });
}

document.getElementById('eprouvetteForm').addEventListener('submit', e => {
  e.preventDefault();
  const chantierId = document.getElementById('chantierSelect').value;
  const ageJour = document.getElementById('ageSelect').value;
  const nombreE = document.getElementById('nombreSelect').value;
  fetch('/api/eprouvettes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chantier_id: chantierId, age_jour: ageJour, nombre: nombreE })
  }).then(() => {
    loadCalendarEvents();
  });
});




// Initialiser
chargerAffaires();
chargerChantiers();
loadCalendarEvents();
loadChantiersInSelect();

window.onload = async () => {
  await chargerAffaires();
  await chargerChantiers();
  await loadCalendarEvents();
  await loadChantiersInSelect();

};

window.addEventListener('DOMContentLoaded', () => {
chargerAffaires();
chargerChantiers();
loadCalendarEvents();
loadChantiersInSelect();
});

