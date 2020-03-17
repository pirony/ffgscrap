Scrap FFG

## Installation

With docker

```bash
git clone git@github.com:pirony/ffgscrap.git ffgscrap
cd ffgscrap
echo 'APP_PORT=3001' >.env # replace 3001 with the port of your choice
docker-compose up
```


Without docker

```bash
git clone git@github.com:pirony/ffgscrap.git directory
cd directory/app
yarn
yarn start
```
## Usage
Visiting [http://localhost:3001/scrap/${club_results_page_id}](http://localhost:3001/scrap/83502d985595aba6d37f5ac0d35c42f0) will return a node stream whose chunks are [ndjson](https://www.npmjs.com/package/ndjson) encoded competitions results.


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
