var Helper = $.import("./libs/Helper.xsjslib");

var addheaders = [
	{
		key: "Content-Type",
		value: "application/json"
	},
	{
		key: "cache-control",
		value: "no-cache"
	}
		                  //{key:"postman-token", value:"06f80fd3-ecde-bedf-0614-9be1431610a9"}
		                  ];

function SyncCurrencysAndRates(body) {
	var cn = $.db.getConnection();
	var ret = {};
	try {
		var response = "";

		var dest = $.net.http.readDestination("CryptoCapJob", "CoinMarketCap");
		var client = new $.net.http.Client();

		var method = "/v1/ticker/?convert=EUR&limit=1400";

		var req = new $.net.http.Request($.net.http.GET, method);
		//var req = new $.web.WebRequest($.net.http.GET, method);
		req.contentType = "application/json; charset: utf-8";

		if (addheaders) {
			if (addheaders.length > 0) {
				for (var j = 0; j < addheaders.length; j++) {
					req.headers.set(addheaders[j].key, addheaders[j].value);
				}
			}
		}

		client.request(req, dest);
		response = client.getResponse().body.asString();
		var Rows = JSON.parse(response);

		var Curr = {};
		var CurrR = {};

		var cri = "SELECT CURRENCY FROM CRYPTOCAP.CURRENCYS";
		var cs = cn.prepareCall(cri);
		cs.execute();
		var rs = cs.getResultSet();
		var ds = Helper.rsToArray(rs);
		for (var i2 = 0; i2 < ds.length; i2++) {
			Curr[ds[i2].CURRENCY] = true;
		}
		cri = "SELECT COIN FROM CRYPTOCAP.RATES";
		cs = cn.prepareCall(cri);
		cs.execute();
		rs = cs.getResultSet();
		ds = Helper.rsToArray(rs);
		for (var i3 = 0; i3 < ds.length; i3++) {
			CurrR[ds[i3].COIN] = true;
		}

		for (var i = 0; i < Rows.length; i++) {

			try {
				var row = Rows[i];
				var query = "";
				if (Curr[row.symbol]) {
					query = "UPDATE CRYPTOCAP.CURRENCYS SET PRICE_USD=" + row.price_usd;
					query += "                  , PRICE_EUR=" + row.price_eur;
					query += "                  , PRICE_BTC=" + row.price_btc;
					query += "                  , PERCENT_CHANGE_1H=" + row.percent_change_1h;
					query += "                  , PERCENT_CHANGE_24H=" + row.percent_change_24h;
					query += "                  , PERCENT_CHANGE_7D=" + row.percent_change_7d;
					query += "                  , AVAILABLE_SUPPLY=" + row.available_supply;
					query += "                  , TOTAL_SUPPLY=" + row.total_supply;
					query += "                  , MAX_SUPPLY=" + row.max_supply;
					query += "                  , MARKET_CAP_USD=" + row.market_cap_usd;
					query += "                  , MARKET_CAP_EUR=" + row.market_cap_eur;
					query += "                  , VOLUME_EUR_24H=" + row["24h_volume_eur"];
					query += "                  , VOLUME_USD_24H=" + row["24h_volume_usd"];
					query += "                  , NAME='" + Helper.replaceAll(row.name, "'", "´") + "'";
					query += "                  , LAST_UPDATE=CURRENT_TIMESTAMP";
					query += " WHERE CURRENCY='" + row.symbol + "'";
					cs = cn.prepareStatement(query);
					cs.execute();
				} else {
					query = "INSERT INTO CRYPTOCAP.CURRENCYS(CURRENCY,NAME,ALGORITHM,CreateDate)";
					query += "SELECT '" + row.symbol + "','" + Helper.replaceAll(row.name, "'", "´") + "',null,CURRENT_TIMESTAMP FROM DUMMY";
					cs = cn.prepareStatement(query);
					cs.execute();
				}

				if (Curr[row.symbol]) {
					query = "UPDATE CRYPTOCAP.RATES SET LASTP=" + row.price_usd;
					query += " WHERE CURRENCY='USD' and COIN='" + row.symbol + "'";
					cs = cn.prepareStatement(query);
					cs.execute();

					query = "UPDATE CRYPTOCAP.RATES SET LASTP=" + row.price_btc;
					query += " WHERE CURRENCY='BTC' and COIN='" + row.symbol + "'";
					cs = cn.prepareStatement(query);
					cs.execute();

					query = "UPDATE CRYPTOCAP.RATES SET LASTP=" + row.price_eur;
					query += " WHERE CURRENCY='EUR' and COIN='" + row.symbol + "'";
					cs = cn.prepareStatement(query);
					cs.execute();

				} else {
					query = "INSERT INTO CRYPTOCAP.RATES(COIN,CURRENCY,SYMBOL,LASTP)";
					query += "SELECT '" + row.symbol + "','USD','$'," + row.price_usd + " FROM DUMMY";
					query += " UNION ALL ";
					query += "SELECT '" + row.symbol + "','EUR','€'," + row.price_eur + " FROM DUMMY";
					query += " UNION ALL ";
					query += "SELECT '" + row.symbol + "','BTC','BTC'," + row.price_btc + " FROM DUMMY";
					cs = cn.prepareStatement(query);
					cs.execute();
				}
				query = "INSERT INTO CRYPTOCAP.RATESHIST(DATE,COIN,CURRENCY,SYMBOL,LASTP)";
				query += "SELECT CURRENT_TIMESTAMP,'" + row.symbol + "','USD','$'," + row.price_usd + " FROM DUMMY";
				query += " UNION ALL ";
				query += "SELECT CURRENT_TIMESTAMP,'" + row.symbol + "','EUR','€'," + row.price_eur + " FROM DUMMY";
				query += " UNION ALL ";
				query += "SELECT CURRENT_TIMESTAMP,'" + row.symbol + "','BTC','BTC'," + row.price_btc + " FROM DUMMY";
				cs = cn.prepareStatement(query);
				cs.execute();
			} catch (ex) {

				var query2 = "INSERT INTO CRYPTOCAP.LOGS(Message,insertdate) values ('" + Helper.replaceAll(ex.message.substring(0, 254), "'", "´") + "',current_timestamp)";
				var cs2 = cn.prepareStatement(query2);
				cs2.execute();
			}
		}
		
		cn.commit();

	} catch (ex) {

		var query2 = "INSERT INTO CRYPTOCAP.LOGS(Message,insertdate) values ('" + Helper.replaceAll(ex.message.substring(0, 254), "'", "´") + "',current_timestamp)";
		var cs2 = cn.prepareStatement(query2);
		cs2.execute();
		cn.commit();
		ret.Success = false;
		ret.Msg = ex.message;
		ret.Dados = null;
	}
}
/*
var cmd = $.request.parameters.get('cmd');

switch (cmd) {
	case "SyncCurrencysAndRates":
		SyncCurrencysAndRates();
		break;

	default:
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
		$.response.setBody('Invalid Command: ' + cmd);
}
 */