
// Purpose of this indicator is to:
// - count the total number of attempts for the current student
// - count the total number of attempts for the dyad
// The dyad attempts indicator will display the same value for both students.

var variableName1 = "attemptcount_current_student"
var variableName2 = "attemptcount_dyad"

//initializations (do not touch)
var detector_output_indiv = {name: variableName1,
						category: "Dashboard",
						value: 0,
						history: {},
						skill_names: "",
						step_id: "",
						transaction_id: "",
						time: ""
						};

var detector_output_dyad = {name: variableName2,
					category: "Dashboard",
					value: 0,
					history: {},
					skill_names: "",
					step_id: "",
					transaction_id: "",
					time: ""
					};

var mailer;

//initialize any custom global variables for this detector here
var prevStep = ""

function receive_transaction( e ){
	//e is the data of the transaction from mailer from transaction assembler

	//send the transaction data to the console
	console.log(e.data);

	//set conditions under which transaction should be processed
	//(i.e., to update internal state and history, without
	//necessarily updating external state and history)
	if(e.data.actor.includes("tudent") && e.data.tool_data.action != "UpdateVariable"){
		//do not touch
		rawSkills = e.data.tutor_data.skills
		var currSkills = []
		for (var property in rawSkills) {
		    if (rawSkills.hasOwnProperty(property)) {
		        currSkills.push(rawSkills[property].name + "/" + rawSkills[property].category)
		    }
		}
		detector_output_indiv.skill_names = currSkills;
		detector_output_indiv.step_id = e.data.tutor_data.step_id;

		//custom processing (insert code here)

		// simply increases by 1 for every transaction
		if (e.data.actor == 'student')
		{
		detector_output_indiv.value += 1;
		detector_output_dyad.value += 1;
		}
		else  {detector_output_dyad.value += 1;}
	}


	//set conditions under which detector should update
	//external state and history
	if(e.data.actor.includes("tudent") && e.data.tool_data.action != "UpdateVariable"){
		detector_output_indiv.time = new Date();
		detector_output_indiv.transaction_id = e.data.transaction_id;
		mailer.postMessage(detector_output_indiv);
		postMessage(detector_output_indiv);
		mailer.postMessage(detector_output_dyad);
		postMessage(detector_output_dyad);
		console.log("output_data = ", detector_output_indiv);
		console.log("output_data2 = ", detector_output_dyad);
	}
}


self.onmessage = function ( e ) {
    console.log(variableName1, " self.onmessage:", e, e.data, (e.data?e.data.commmand:null), (e.data?e.data.transaction:null), e.ports);
		console.log(variableName2, " self.onmessage:", e, e.data, (e.data?e.data.commmand:null), (e.data?e.data.transaction:null), e.ports);
		switch( e.data.command )
    {
    case "connectMailer":
	mailer = e.ports[0];
	mailer.onmessage = receive_transaction;
	break;
    default:
	break;
    }
}
