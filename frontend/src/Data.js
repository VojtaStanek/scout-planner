function get(path, id) {
  return fetch(`http://localhost:4000${path}/${id}`)
    .then(resp => {
      if (!resp.ok) {
        throw new Error(`HTTP error: ${resp.status}`);
      }
      return resp.json();
    })
}

function getAll(path) {
  return fetch(`http://localhost:4000${path}`)
    .then(resp => {
      if (!resp.ok) {
        throw new Error(`HTTP error: ${resp.status}`);
      }
      return resp.json();
    })
    .then(data =>
      data.reduce((acc, cur) => ({ ...acc, [cur._id]: cur}), {})
    );
}

function post(path, data) {
  return fetch(`http://localhost:4000${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    .then(resp => {
      if (!resp.ok) {
        throw new Error(`HTTP error: ${resp.status}`);
      }
      return resp.json();
    });
}

function put(path, data) {
  return fetch(`http://localhost:4000${path}/${data._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    .then(resp => {
      if (!resp.ok) {
        throw new Error(`HTTP error: ${resp.status}`);
      }
      return resp.json();
    });
}

function remove(path, id) {
  return fetch(`http://localhost:4000${path}/${id}`, {
      method: 'DELETE',
    })
    .then(resp => {
      if (!resp.ok) {
        throw new Error(`HTTP error: ${resp.status}`);
      }
      return resp.json();
    });
}

['program', 'pkg', 'rule'].forEach((entity) => {
  const name = entity.charAt(0).toUpperCase() + entity.slice(1);

  exports[`get${name}s`] = () => getAll(`/${entity}s`);
  exports[`get${name}`] = (id) => get(`/${entity}s`, id);
  exports[`add${name}`] = (data) => post(`/${entity}s`, data);
  exports[`update${name}`] = (data) => post(`/${entity}s`, data);
  exports[`delete${name}`] = (id) => remove(`/${entity}s`, id);
});
