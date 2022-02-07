function engineeringNotation(number, precision=3) {

    var intUnitMap = {Y:1e24 , Z:1e21, E: 1e18, P:1e15,T:1e12,G:1e9,M:1e6,k:1e3};
    var bigUnitMap = {Y:BigInt(1e24) , Z:BigInt(1e21), E:BigInt(1e18),
    				  P:BigInt(1e15),T:BigInt(1e12),G:BigInt(1e9),
    				  M:BigInt(1e6),k:BigInt(1e3)
    				};
   // var small_unit_map = {y:1e-24, z:1e-21,a: 1e-18,f:1e-15, p:1e12, n:1e9, u:1e6, m:1e3};
    var space = '&thinsp;';

  //  console.log("eng:",number,typeof(number));
   	absnumber = number;
   	let isneg = false;
   	if (number < 0) {
   		absnumber = -number;
   		isneg = true;

   	}

   	var unitMap = intUnitMap;
   	var factor = 1000;
   	var remainder = 0;

   	if (typeof(number) === 'bigint') {
   		unitMap = bigUnitMap;
   		factor = 1000n
   		remainder = 0n;
   	}

   	var base = absnumber
   	var index = 0;
   	var remainder_factor = factor;

//   	console.log(base, number, base > factor);
   	while (base > factor) {
   			index = index +1;
   			oldbase = base;
   			base = base / factor;
   			new_remainder = oldbase - (base * factor);
   			remainder = (new_remainder * remainder_factor ) + remainder;
   			remainder_factor = remainder_factor * factor; 
   	
   	}
   	
   	let string_remainder = remainder.toString().padEnd(precision,"0").substring(0, precision);
   	var prefix = "";
   	if (isneg) {
   		prefix="-"
   	}
   	result = prefix + base + "." + string_remainder;
   	if (index > 0) { 
   		result += " e"+ (index * 3);
   	}
   	

	return (result);
	
}

module.exports = engineeringNotation