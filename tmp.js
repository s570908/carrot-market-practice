fetch("/api/users/enter", {
  method: "POST",
  body: JSON.stringify(data),
  headers: {
    "Content-Type": "application/json",
  },
});

const [enter, { data, error, loaing }] = useMutation("/api/users/enter");
enter();
