from typing import Dict, Text, Any, List, Union

from rasa_sdk import Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.forms import FormValidationAction


class ValidateHotelForm(FormValidationAction):
    

    def name(self) -> Text:
        return "validate_hotel_form"

    @staticmethod
    def city_db() -> List[Text]:

        return [
            "londra",
            "tirana",
			"berlino",
			"andorra la vella",
			"vienna",
			"bruxelles",
			"minsk",
			"sarajevo",
			"sofia",
			"citta del vaticano",
		    "zagabria",
			"copenaghen",
			"bratislava",
		 	"lubiana",
			"madrid",
		    "tallin",
			"helsinki",
			"parigi",
			"atene",
			"budapest",
			"dublino",
			"reykjavik",
			"roma",
			"riga",
			"vaduz",
			"vilnius",
			"lussemburgo",
			"la valletta",
			"chisinau",
			"monaco",
			"podgorica",
			"oslo",
		    "amsterdam",
			"varsavia",
			"lisbona",
			"londra",
			"praga",
		    "skopje",
			"bucarest",
			"san marino",
			"belgrado",
			"stoccolma",
			"berna",
			"kiev",

        ]
        

    @staticmethod
    def is_int(string: Text) -> bool:
       

        try:
            int(string)
            return True
        except ValueError:
            return False

    def validate_city(
        self,
        value: Text,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:
        

        if value.lower() in self.city_db():
            return {"city": value}
        else:
            dispatcher.utter_message(template="utter_wrong_city")
            return {"city": None}

    def validate_num_people(
        self,
        value: Text,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:
        

        if self.is_int(value) and int(value) > 0:
            return {"num_people": value}
        else:
            dispatcher.utter_message(template="utter_wrong_num_people")
            return {"num_people": None}

    def validate_room(
        self,
        value: Text,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> Dict[Text, Any]:
        

        if isinstance(value, str):
            if "suite" in value:
                return {"room": True}
            elif "semplice" in value:
                return {"room": False}
            else:
                dispatcher.utter_message(template="utter_wrong_room")
                return {"room": None}

        else:
            return {"room": value}
            
            
            
            
    
