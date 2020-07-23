function InteractionBase(){
	const se = require("swarm-engine");
	if(typeof $$ === "undefined" || typeof $$.swarmEngine === "undefined"){
		se.initialise();
	}

	this.createHandler = function(keyDID, powerCord, callback){
		let identity = "anonymousIdentity"; // this should be get from securityContext

		let cord_identity;
		try{
			const crypto = require("pskcrypto");
			cord_identity = crypto.pskHash(keyDID, "hex");
			$$.swarmEngine.plug(cord_identity, powerCord);
		}catch(err){
			return callback(err);
		}
		$$.interactions.startSwarmAs(cord_identity, "transactionHandler", "start", identity, "TooShortBlockChainWorkaroundDeleteThis", "add").onReturn(err => {
			if (err) {
				return callback(err);
			}

			const handler = {
				attachTo : $$.interactions.attachTo,
				startTransaction : function (transactionTypeName, methodName, ...args) {
					//todo: get identity from context somehow
					return $$.interactions.startSwarmAs(cord_identity, "transactionHandler", "start", identity, transactionTypeName, methodName, ...args);
				}
			};
			//todo implement a way to know when thread/worker/isolate is ready
			setTimeout(()=>{
				callback(undefined, handler);
			}, 100);
		});
	}

}
module.exports = new InteractionBase();