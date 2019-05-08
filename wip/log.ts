interface Log {
	id: string; // gen1randombattle-12345
	format: string; // gen1randombattle;
	timestamp: string; // Date.toString();
	winner: string; // Name
  endType?: 'normal' | 'forced' | 'forfeit';
	seed: [number, number, number, number];
	turns: number;
  score: [number, number]; // [number, number, number?, number?]

	p1: string; // Name
	p2: string; // Name
	//p3?: string; // Name
	//p4?: string; // Name

	p1team: PokemonSet[];
	p2team: PokemonSet[];
	//p3team?: PokemonSet[];
	//p4team?: PokemonSet[];

	p1rating: {};
	p2rating: {};
	//p3rating?: {};
	//p4rating?: {};

	log: string[];
	inputLog: string[];
};

interface Battle {
  p1: Player;
  p2: Player;
  matchups: Array<[string, string, Outcome]>; // [ID, ID, Outcome] ?
  turns: number;
  endType?: 'normal' | 'forced' | 'forfeit';
};

interface Player {
  name: string; // ID?
  team: Team;
}

interface Team {
  pokemon: Pokemon[];
  tags: ID[];
}

interface Pokemon {
  species: string; // ID?
  turnsOut: number;
  KOs: number;
  tags: ID[];
}

//interface BattleIR {
  //p1: PlayerIR;
  //p2: PlayerIR;
  //matchups: [string, string, Outcome];
  //turns: number;
  //endType?: 'normal' | 'forced' | 'forfeit';
//}

//interface PlayerIR {
  //trainer: string; // Name, unicode -> ?
  //team: SlotIR[] // length 6
  //[tag: string]: string; // team tags
//}

//interface SlotIR {
  //species: string;
  //KOs: number;
  //turnsOut: number;
//}
