import http from 'k6/http';
import { sleep } from 'k6';

// Configuration du test de charge
export let options = {
  // Stages: simulation d'une montée en charge progressive
  stages: [
    { duration: '30s', target: 5 },   // Pendant 30s, on monte jusqu'à 5 utilisateurs virtuels
    { duration: '1m',  target: 5 },   // On reste à 5 utilisateurs pendant 1 minute
    { duration: '30s', target: 0 },   // Puis on redescend à 0 pendant 30s
  ],
  thresholds: {
    // Exemples de seuils : 
    // - Moins de 2% de requêtes doivent échouer
    'http_req_failed': ['rate<0.02'],
    // - Le 95ᵉ percentile doit rester sous 500 ms
    'http_req_duration': ['p(95)<500'],
  },
};

// Le test lui-même
export default function () {
  // On envoie une requête GET sur l'endpoint /cryptos
  let res = http.get('http://localhost:5000/cryptos');

  // On peut vérifier que le statut est 200, etc.
  // (k6 a sa propre façon de gérer les checks, optionnel ici)
  // check(res, {
  //   'status is 200': (r) => r.status === 200,
  // });

  // petite pause de 1 seconde, pour simuler un temps entre deux actions
  sleep(1);
}
