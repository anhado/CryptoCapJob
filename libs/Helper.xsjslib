var rsToArray = function(rs) {
	var i;
	var ret = [];
	var meta = rs.getMetaData();
	var numcols = meta.getColumnCount();
	var test = [];
	while (rs.next()) {
		var obj = {};
		for (i = 1; i <= numcols; ++i) {
			//test.push({coltype: meta.getColumnType(i), colName: meta.getColumnName(i)});
			//continue;
			// row.push({col: meta.getColumnName(i), value: rs.getNString(i)});			
			//row.push({value: rs.getNString(i), coltype: meta.getColumnType(i), colName: meta.getColumnName(i)});

			//XSAPI Line 137
			switch (meta.getColumnType(i)) {
				case 1: //TINYINT
				case 2: //SMALLINT
				case 3: //Integer
				case 4: //BIGINT
					obj[meta.getColumnLabel(i)] = rs.getInteger(i);
					break;
				case 5: //DECIMAL
				case 6: //REAL
				case 7: //DOUBLE
					obj[meta.getColumnLabel(i)] = rs.getDecimal(i);
					break;
				case 8: //CHAR
				case 9: //VARCHAR
				case 10: //NCHAR
				case 11: //nvarchar
					obj[meta.getColumnLabel(i)] = rs.getNString(i);
					break;
				case 16: //LongDate
					obj[meta.getColumnLabel(i)] = rs.getNString(i); //rs.getDate(i);
					break;
				case 25: //CLOB
				case 26: //NCLob
				case 27: //BLob
					obj[meta.getColumnLabel(i)] = rs.getNClob(i);
					break;
				default:
					obj[meta.getColumnLabel(i)] = rs.getNString(i);
			}

			/*
			if (meta.getColumnType(i)===11)//nvarchar
			{
				obj[meta.getColumnLabel(i)] = rs.getNString(i);
				//row.push({value:rs.getNString(i), name:meta.getColumnName(i)});
			}
			else if (meta.getColumnType(i)===8)//CHAR
			{
				obj[meta.getColumnLabel(i)] = rs.getNString(i);
			}
			else if (meta.getColumnType(i)===5)//DECIMAL
			{
				obj[meta.getColumnLabel(i)] = rs.getDecimal(i);
			}
			else if (meta.getColumnType(i)===2)//SMALLINT
			{
				obj[meta.getColumnLabel(i)] = rs.getInteger(i);
			}
			else if (meta.getColumnType(i)===3)//Integer
			{
				obj[meta.getColumnLabel(i)] = rs.getInteger(i);
			}
			else if (meta.getColumnType(i)===16)//LongDate
			{
				obj[meta.getColumnLabel(i)] = rs.getNString(i); //rs.getDate(i);
			}
			else if (meta.getColumnType(i)===26)//NCLob
			{
				obj[meta.getColumnLabel(i)] = rs.getNClob(i);
			}
			else if (meta.getColumnType(i)===27)//BLob
			{
				obj[meta.getColumnLabel(i)] = rs.getNClob(i);
			}
			else if (meta.getColumnType(i)===11)//Nvarchar
			{
				obj[meta.getColumnLabel(i)] = rs.getNString(i);
			}
			else 
			{
				obj[meta.getColumnLabel(i)] = rs.getNString(i);
			}
			*/
		}
		ret.push(obj);
	}
	return ret;
};

var rsToMetadata = function(rs) {
	var i;
	var ret = [];
	var meta = rs.getMetaData();
	var numcols = meta.getColumnCount();

	for (i = 1; i <= numcols; ++i) {
		ret.push({
			label: meta.getColumnLabel(i),
			name: meta.getColumnName(i),
			type: meta.getColumnType(i),
			typename: meta.getColumnTypeName(i),
			displaysize: meta.getColumnDisplaySize(i),
			precision: meta.getPrecision(i)
		});
	}

	return ret;
};

function getinfoTable(schema, table) {
	try {
		var cn, ds = [],
			cs, rs;
		cn = $.db.getConnection();

		var qrystring = 'SELECT "COLUMN_NAME","POSITION", "DATA_TYPE_ID", "DATA_TYPE_NAME","LENGTH","IS_NULLABLE" ' + ' FROM "TABLE_COLUMNS" ' +
			' WHERE "SCHEMA_NAME"=\'' + schema + '\' AND "TABLE_NAME"=\'' + table + '\'  ';
		cs = cn.prepareCall(qrystring);
		cs.execute();

		rs = cs.getResultSet();
		ds = rsToArray(rs);

		var newobj = {};
		if (ds.length > 0) {
			var i = 0;
			for (i = 0; i < ds.length; i++) {
				newobj[ds[i].COLUMN_NAME] = ds[i];
			}
		}

		return newobj;

	} catch (e) {
		return [];
	}
}

function crudgenerator(schema, table, obj, keys) {
	try {
		var tmpfields = '';
		var tmpvals = '';
		var tmpfieldsup = '';
		var tmpfieldkey = '';

		var infotable = getinfoTable(schema, table);
		var p;
		var arre = [];
		for (p in obj) {
			if (p !== undefined && infotable[p.toString()] !== undefined && obj[p.toString()] !== undefined) {

				switch (infotable[p.toString()].DATA_TYPE_NAME) {
					case 'NVARCHAR':
					case 'CHAR':
					case 'VARCHAR':
					case 'CLOB':
					case 'NCLOB':
					case 'NCHAR':
					case 'BLOB':
					case 'TIMESTAMP':
						if (tmpfields !== '') {
							tmpfields += ',';
						}
						tmpfields += '"' + infotable[p.toString()].COLUMN_NAME + '"';

						if (tmpvals !== '') {
							tmpvals += ',';
						}
						tmpvals += '\'' + obj[p.toString()] + '\'';

						if (keys.indexOf(p.toString()) !== -1) {
							//chave
							if (tmpfieldkey !== '') {
								tmpfieldkey += ' AND ';
							}
							tmpfieldkey += '"' + infotable[p.toString()].COLUMN_NAME + '" = \'' + obj[p.toString()] + '\' ';
						} else {
							if (tmpfieldsup !== '') {
								tmpfieldsup += ',';
							}
							tmpfieldsup += '"' + infotable[p.toString()].COLUMN_NAME + '" =' + (obj[p.toString()] === null ? null : '\'' + obj[p.toString()] +
								'\'') + '';
						}
						break;
					case 'DECIMAL':
					case 'DOUBLE':
					case 'REAL':
						obj[p.toString()] = obj[p.toString()].toString().replace(",", ".");
						if (isNaN(parseFloat(obj[p.toString()]))) {
							obj[p.toString()] = 0;
						}

						if (tmpfields !== '') {
							tmpfields += ',';
						}
						tmpfields += '"' + infotable[p.toString()].COLUMN_NAME + '"';

						if (tmpvals !== '') {
							tmpvals += ',';
						}
						tmpvals += obj[p.toString()];

						if (keys.indexOf(p.toString()) !== -1) {
							//chave
							if (tmpfieldkey !== '') {
								tmpfieldkey += ' AND ';
							}
							tmpfieldkey += '"' + infotable[p.toString()].COLUMN_NAME + '" = ' + obj[p.toString()] + ' ';
						} else {
							if (tmpfieldsup !== '') {
								tmpfieldsup += ',';
							}
							tmpfieldsup += '"' + infotable[p.toString()].COLUMN_NAME + '" =' + obj[p.toString()];
						}

						break;
					case 'INTEGER':
					case 'BIGINT':
					case 'SMALLINT':
					case 'TINYINT':
						obj[p.toString()] = obj[p.toString()].toString().replace(",", ".");
						if (isNaN(parseInt(obj[p.toString()], 0))) {
							obj[p.toString()] = 0;
						}

						if (tmpfields !== '') {
							tmpfields += ',';
						}
						tmpfields += '"' + infotable[p.toString()].COLUMN_NAME + '"';

						if (tmpvals !== '') {
							tmpvals += ',';
						}
						tmpvals += obj[p.toString()];

						if (keys.indexOf(p.toString()) !== -1) {
							//chave
							if (tmpfieldkey !== '') {
								tmpfieldkey += ' AND ';
							}
							tmpfieldkey += '"' + infotable[p.toString()].COLUMN_NAME + '" = ' + obj[p.toString()] + ' ';
						} else {
							if (tmpfieldsup !== '') {
								tmpfieldsup += ',';
							}
							tmpfieldsup += '"' + infotable[p.toString()].COLUMN_NAME + '" =' + obj[p.toString()] + '';
						}

						break;
					case undefined:
						break;
					default:

						break;
				}
			} else {
				arre.push(p.toString());
				//arre.push(infotable[p.toString()]);
			}

		}

		var ret = {};
		ret.select = 'SELECT ' + tmpfields + ' FROM "' + schema + '"."' + table + '" ';
		if (tmpfieldkey !== '') {
			ret.select += ' WHERE ' + tmpfieldkey;
		}

		ret.update = 'UPDATE  "' + schema + '"."' + table + '" SET ' + tmpfieldsup;
		if (tmpfieldkey !== '') {
			ret.update += ' WHERE ' + tmpfieldkey;
		}

		ret.insert = 'INSERT INTO  "' + schema + '"."' + table + '" (' + tmpfields + ') VALUES(' + tmpvals + ')';

		ret.del = 'DELETE FROM  "' + schema + '"."' + table + '" ';
		if (tmpfieldkey !== '') {
			ret.del += ' WHERE ' + tmpfieldkey;
		}

		return ret;

	} catch (e) {
		return {
			error: e.toString()
		};
	}
}

function pad(num, size) {
	var s = num + "";
	while (s.length < size) s = "0" + s;
	return s;
}

var sort_by = function(field, reverse, primer) {

	var key = primer ?
		function(x) {
			return primer(x[field])
		} :
		function(x) {
			return x[field]
		};

	reverse = !reverse ? 1 : -1;

	return function(a, b) {
		return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
	}
}

var Exist_Table = function(DataBase, Table) {
	try {
		var cn = $.db.getConnection();
		var cs = cn.prepareCall('SET SCHEMA "' + DataBase + '"');
		cs.execute();

		var Ret = {};

		try {
			var query = 'Select top 1 * from "' + Table + '"  \n';

			cs = cn.prepareStatement(query);
			cs.execute();
			var rs = cs.getResultSet();
			Ret.Exist = true;
		} catch (ex) {
			Ret.Exist = false;
		}

		return Ret;
	} catch (ex) {
		throw new Error(ex.message);
	}
};

function clone(obj) {
	var copy;

	// Handle the 3 simple types, and null or undefined
	if (null == obj || "object" != typeof obj) return obj;

	// Handle Date
	if (obj instanceof Date) {
		copy = new Date();
		copy.setTime(obj.getTime());
		return copy;
	}

	// Handle Array
	if (obj instanceof Array) {
		copy = [];
		for (var i = 0, len = obj.length; i < len; i++) {
			copy[i] = clone(obj[i]);
		}
		return copy;
	}

	// Handle Object
	if (obj instanceof Object) {
		copy = {};
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
		}
		return copy;
	}

	throw new Error("Unable to copy obj! Its type isn't supported.");
}

function sleep(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds) {
			break;
		}
	}
}

function replaceAll(str, find, replace) {
	return str.replace(new RegExp(find, 'g'), replace);
}

function addMinutes(date, minutes) {
	return new Date(date.getTime() + minutes * 60000);
}

function isInt(value) {
	var x;
	if (isNaN(value)) {
		return false;
	}
	x = parseFloat(value);
	return (x | 0) === x;
}

//retorno de mensagens generico para manter uniformidade
var returnSuccess = function(ret, status) {
	$.response.contentType = 'application/json; charset=UTF-8';
	$.response.setBody(JSON.stringify(ret));
	$.response.status = status || $.net.http.OK;
};

var returnError = function(msg, status) {
	$.response.contentType = 'application/json; charset=UTF-8';
	$.response.setBody(msg);
	$.response.status = status || 400;
};