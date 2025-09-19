fetch("http://localhost:3001/languages")
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e));
