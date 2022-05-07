### ens owners

```
curl 'https://api.thegraph.com/subgraphs/name/ensdomains/ens' \
  -H 'authority: api.thegraph.com' \
  -H 'pragma: no-cache' \
  -H 'cache-control: no-cache' \
  -H 'sec-ch-ua: " Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'content-type: application/json' \
  -H 'accept: */*' \
  -H 'origin: https://thegraph.com' \
  -H 'sec-fetch-site: same-site' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-dest: empty' \
  -H 'referer: https://thegraph.com/' \
  -H 'accept-language: en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7' \
  --data-raw '{"query":"{\n  domains(first: 5, where: {owner: \"0xa729addefe1fa7bce87053ed55d55edddd13de60\"}) {\n    id\n    name\n    owner {\n      id\n    }\n  }\n  \n}\n","variables":null}' \
  --compressed
```
