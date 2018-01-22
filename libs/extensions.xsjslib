if (helper === undefined){
    var helper = $.import("./Helper.xsjslib");
}


var _parseFloat=function(value){
    var result; 
    if (value === null || value === undefined){
        value = ""; 
    }
    value=value.toString(); // garante string
    value = value.replace(/ /gi, "").replace(/,/gi, "#").replace(/\./gi, "#");
    if (value === ""){
        result = 0; 
    }
    else{
        var split=value.split("#");
        if( split.length > 1){
            var slice= split.slice(0, split.length-1); 
            value = slice.join("") + "."+ split[split.length-1]; // ponto no ultimo que Ã© o separador no js
        }else{
            value = split[0]; 
        }
        result = parseFloat(value, 10);
    }
    return result; 
};
var getDateString = function(data){
    if (data===undefined || data===null){
        data=new Date(); 
    }
    var d=  data.getDate().toString();
    var m= (data.getMonth()+1).toString();
	var y=  data.getFullYear().toString();
	
	if (m.length<=1)
	{
		m="0"+m;
	}
	if (d.length<=1)
	{
		d="0"+d;
	} 
	return y+"-"+m+"-"+d;
}; 
var getTimestampString = function(data){
    if (data===undefined || data===null){
        data=new Date(); 
    }
    var d=  data.getDate().toString();
    var m= (data.getMonth()+1).toString();
	var y=  data.getFullYear().toString();
	
	if (m.length<=1)
	{
		m="0"+m;
	}
	if (d.length<=1)
	{
		d="0"+d;
	} 
	return y+"-"+m+"-"+d+" "+data.getHours()+":"+data.getMinutes()+":"+data.getSeconds();
}; 

function SendResponse(body, satus){
	$.response.contentType = "application/json";
	$.response.setBody(body);
	$.response.status = satus;
}

function ExecuteSelectToArrayParams(Database, Select, params, cn){
    var cs ; 
    if (!cn){
    	cn = $.db.getConnection();
    	cs = cn.prepareCall('SET SCHEMA "' + Database + '"');
    	cs.execute();
    }
		
	cs = cn.prepareStatement(Select);
	cs.execute();
	var rs = cs.getResultSet();

    return helper.rsToArray(rs);
}

function ExecuteSelectToArray(Database, Select, cn){
    var cs ; 
    if (!cn){
    	cn = $.db.getConnection();
    	cs = cn.prepareCall('SET SCHEMA "' + Database + '"');
    	cs.execute();
    }
		
	cs = cn.prepareStatement(Select);
	cs.execute();
	var rs = cs.getResultSet();

    return helper.rsToArray(rs);
}
function ExecuteSelectValueTypeToArray(array,Database, Select, cn){
    //Função que recebe um array com os parametros do select, para poder fazer o setString()/setDouble()...etc
    var cs ; 
    if (!cn){
    	cn = $.db.getConnection();
    	cs = cn.prepareCall('SET SCHEMA "' + Database + '"');
    	cs.execute();
    }
    cs = cn.prepareStatement(Select);
    
    for(var i = 1; i<= array.length; i++){
        if(array[i-1].tipo === "string"){
            cs.setString(i,array[i-1].valor);
        }else if(array[i-1].tipo === "int"){
            cs.setInteger(i,array[i-1].valor);
        }else if(array[i-1].tipo === "float"){
            cs.setFloat(i,array[i-1].valor);
        }else if(array[i-1].tipo === "double"){
            cs.setDouble(i,array[i-1].valor);
        }else if(array[i-1].tipo === "date"){
            cs.setDate(i,array[i-1].valor);
        }
    }
    
	cs.execute();
	var rs = cs.getResultSet();

    return helper.rsToArray(rs);
}
 
function myReplace(theText,oldString,newString){
    
	  return theText.replace(new RegExp(oldString, 'g'), newString);
} 

//funÃ§Ã£o que devolve valor para inserir na bd certinho...
function _getValorParaBd (data){
    var toRet=" NULL ";
    if (data!==null && data!=="null" && data!==undefined && data!=="undefined" && data!=="" ){
        toRet= "'"+data+"'"; 
    }
    return toRet; 
}