import NamespaceHolder from '/classes/NamespaceHolder.js';

const skillLevelTier = {
    beginner: 'beginner',
    intermediate: 'intermediate',
    expert: 'expert',
};

const combatSkillsPlan = {
    [skillLevelTier.beginner]: {
        strength: 20,
        defense: 20,
        dexterity: 20,
        agility: 20,
    },
    [skillLevelTier.intermediate]: {
        strength: 100,
        defense: 100,
        dexterity: 100,
        agility: 100,
    },
    [skillLevelTier.expert]: {
        strength: 200,
        defense: 200,
        dexterity: 200,
        agility: 200,
    }
};
const uniSkillsPlan = {
    [skillLevelTier.beginner]: {
        hacking: 30
    },
    [skillLevelTier.intermediate]: {
        hacking: 100
    },
    [skillLevelTier.expert]: {
        hacking: 300
    },
};

const interval = 1000;

/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog('disableLog');
    ns.disableLog('sleep');
    ns.disableLog('universityCourse');
    ns.disableLog('gymWorkout');
    ns.disableLog('stopAction');

    const trainCombatSkills = determineTrainCombatSkills(ns);
    const uniSkills = determineUniSkills(ns);

    const uni = University.getBestUniversity(ns.getPlayer().city);

    if (uni) {
        if (ns.getPlayer().hacking < uniSkills.hacking) {
            if (uni.takeBestHackingCourse(ns, false)) {
                ns.print(`Learning hacking until skill level ${uniSkills.hacking}`);

                while (ns.isBusy() && ns.getPlayer().hacking < uniSkills.hacking) {
                    await ns.sleep(interval);
                }
            } else {
                ns.print(`Couldn't start learning hacking at ${uni.name}`);
            }

            if (ns.isBusy()) {
                ns.stopAction();
            }
        }
    } else {
        ns.print(`There's no university in ${ns.getPlayer().city}!`);
    }

    const gym = Gym.getBestGym(ns.getPlayer().city);

    if (gym) {
        for (const stat of Object.keys(trainCombatSkills)) {
            if (ns.getPlayer()[stat] < trainCombatSkills[stat]) {
                if (gym.workOut(ns, stat, false)) {
                    ns.print(`Training ${stat} until skill level ${trainCombatSkills[stat]}`);
                    
                    while (ns.getPlayer()[stat] < trainCombatSkills[stat]) {
                        await ns.sleep(interval);
                    }
                } else {
                    ns.print(`Couldn't start ${stat} workout at ${gym.name}`);
                }
            }
        }
        
        if (ns.isBusy()) {
            ns.stopAction();
        }
    } else {
        ns.print(`There's no gym in ${ns.getPlayer().city}!`);
    }
    
    ns.print('Done learning and training.');
}

/**
 * @param {NS} ns Namespace
 * @returns {Object}
 */
function determineTrainCombatSkills(ns) {
    const multKeys = [
        'strength_mult',
        'strength_exp_mult',
        'defense_mult',
        'defense_exp_mult',
        'dexterity_mult',
        'dexterity_exp_mult',
        'agility_mult',
        'agility_exp_mult',
    ];

    const player = ns.getPlayer();
    const avgBonus = multKeys.map(key => player[key]).reduce((prev, current) => prev + current) / multKeys.length;
    let level;

    if (avgBonus <= 4) {
        level = skillLevelTier.beginner;
    } else if (avgBonus <= 10) {
        level = skillLevelTier.intermediate;
    } else {
        level = skillLevelTier.expert;
    }

    // ns.tprint(`Combat skills: avg bonus = ${avgBonus}`);
    return combatSkillsPlan[level];
}

/**
 * @param {NS} ns Namespace
 * @returns {Object}
 */
function determineUniSkills(ns) {
    const multKeys = [
        'hacking_chance_mult',
        'hacking_exp_mult',
        'hacking_grow_mult',
        'hacking_money_mult',
    ];

    const player = ns.getPlayer();
    const avgBonus = multKeys.map(key => player[key]).reduce((prev, current) => prev + current) / multKeys.length;
    let level;

    if (avgBonus <= 3) {
        level = skillLevelTier.beginner;
    } else if (avgBonus <= 8) {
        level = skillLevelTier.intermediate;
    } else {
        level = skillLevelTier.expert;
    }

    // ns.tprint(`Uni skills: avg bonus = ${avgBonus}`);
    return uniSkillsPlan[level];
}

/**
 * Enum of Player stats.
 */
class PlayerStat {
    static hacking = 'hacking';
    static strength = 'strength';
    static defense = 'defense';
    static dexterity = 'dexterity';
    static agility = 'agility';
    static charisma = 'charisma';
    static intelligence = 'intelligence';
}

/**
 * Enum of Cities.
 */
class City {
    static aevum = 'Aevum';
    static chongqing = 'Chongqing';
    static sector12 = 'Sector-12';
    static newTokyo = 'New Tokyo';
    static ishima = 'Ishima';
    static volhaven = 'Volhaven';
}

class Location {
    #name;
    #city;

    constructor(config) {
        this.#name = config.name;
        this.#city = config.city;
    }

    get name() {
        return this.#name;
    }

    get city() {
        return this.#city;
    }

    isInCity(ns) {
        return ns.getPlayer().city === this.#city;
    }

    travelToCity(ns) {
        return ns.travelToCity(this.#city);
    }
}

class Gym extends Location {
    static ironGym = new Gym({
        name: 'Iron Gym',
        city: City.sector12,
        expMult: 1
    });
    static crushFitness = new Gym({
        name: 'Crush Fitness',
        city: City.aevum,
        expMult: 2
    });
    static milleniumFitnessGym = new Gym({
        name: 'Millenium Fitness Gym',
        city: City.volhaven,
        expMult: 4
    });
    static snapFitnessGym = new Gym({
        name: 'Snap Fitness Gym',
        city: City.aevum,
        expMult: 5
    });
    static powerhouseGym = new Gym({
        name: 'Powerhouse Gym',
        city: City.sector12,
        expMult: 10
    });
    static gyms = [
        Gym.ironGym,
        Gym.crushFitness,
        Gym.milleniumFitnessGym,
        Gym.snapFitnessGym,
        Gym.powerhouseGym
    ];

    #stats = [
        PlayerStat.strength,
        PlayerStat.defense,
        PlayerStat.dexterity,
        PlayerStat.agility,
    ];

    #expMult;

    /**
     * Returns the best gym available. If provided with a `city`, then this will
     * return the best gym for that city.
     * @param {string} [city=null] The City.
     * @return {Gym} The best gym.
     */
    static getBestGym(city = null) {
        const sorted = Gym.gyms
            .slice()
            .filter(gym => city === null || city === gym.city)
            .sort((gymA, gymB) => gymB.expMult - gymA.expMult);

        return sorted[0] || null;
    }

    constructor(config) {
        super(config);
        this.#expMult = config.expMult;
    }

    get expMult() {
        return this.#expMult;
    }

    /**
     * Work out at the gym.
     * @param {string} stat The stat to train.
     * @param {boolean} forceFocus `true` to force player focus on the workout. If `false`, this will still
     * focus if the player isn't busy.
     * @return `true` if the workout was successfully started; otherwise `false`.
     */
    workOut(ns, stat, forceFocus = false) {
        if (this.#stats.includes(stat)) {
            return ns.gymWorkout(this.name, stat, forceFocus || !ns.isBusy());
        }
        return false;
    }
}

class UniversityCourse {
    static computerScience = new UniversityCourse({name: 'Study Computer Science', stat: PlayerStat.hacking, expMult: 1});
    static dataStructures = new UniversityCourse({name: 'Data Structures', stat: PlayerStat.hacking, expMult: 2});
    static networks = new UniversityCourse({name: 'Networks', stat: PlayerStat.hacking, expMult: 3});
    static algorithms = new UniversityCourse({name: 'Algorithms', stat: PlayerStat.hacking, expMult: 4});
    static management = new UniversityCourse({name: 'Management', stat: PlayerStat.charisma, expMult: 1});
    static leadership = new UniversityCourse({name: 'Leadership', stat: PlayerStat.charisma, expMult: 2});
    static courses = [
        UniversityCourse.computerScience,
        UniversityCourse.dataStructures,
        UniversityCourse.networks,
        UniversityCourse.algorithms,
        UniversityCourse.management,
        UniversityCourse.leadership,
    ];

    static getBestForStat(stat) {
        const sorted = UniversityCourse.courses
            .slice()
            .filter(course => course.stat === stat)
            .sort((courseA, courseB) => courseB.expMult - courseA.expMult);

        return sorted[0] || null;
    }

    #name;
    #stat;
    #expMult;

    constructor(config) {
        this.#name = config.name;
        this.#stat = config.stat;
        this.#expMult = config.expMult;
    }

    get name() {
        return this.#name;
    }
    
    get stat() {
        return this.#stat;
    }

    get expMult() {
        return this.#expMult;
    }
}

class University extends Location {
    static rothmanUniversity = new University({
        name: 'Rothman University',
        city: City.sector12,
        expMult: 2,
    });
    static summitUniversity = new University({
        name: 'Summit University',
        city: City.aevum,
        expMult: 3
    });
    static zbInstituteOfTechnology = new University({
        name: 'ZB Institute of Technology',
        city: City.volhaven,
        expMult: 4,
    });

    static universities = [
        University.rothmanUniversity,
        University.summitUniversity,
        University.zbInstituteOfTechnology,
    ];

    #courseNames = [
        UniversityCourse.computerScience.name,
        UniversityCourse.dataStructures.name,
        UniversityCourse.networks.name,
        UniversityCourse.algorithms.name,
        UniversityCourse.management.name,
        UniversityCourse.leadership.name,
    ];

    #expMult;

    /**
     * Returns the best university available. If provided with a `city`, then this will
     * return the best university for that city.
     * @param {string} [city=null] The City.
     * @return {University} The best university.
     */
    static getBestUniversity(city = null) {
        const sorted = University.universities
            .slice()
            .filter(uni => city === null || city === uni.city)
            .sort((uniA, uniB) => uniB.expMult - uniA.expMult);

        return sorted[0] || null;
    }

    constructor(config) {
        super(config);
        this.#expMult = config.expMult;
    }

    get expMult() {
        return this.#expMult;
    }

    /**
     * Take a university class.
     * @param {NS} ns Namespace.
     * @param {string} courseName Name of the course.
     * @param {boolean|string} [focus='auto'] `true` to focus the player on the course, `false` not to . If `auto`, then this will focus if the player isn't busy.
     * This is the default value.
     * @return `true` if the course was successfully started; otherwise `false`.
     */
    takeCourse(ns, courseName, focus = 'auto') {
        if (this.#courseNames.includes(courseName)) {
            return ns.universityCourse(this.name, courseName, focus === 'auto' ? !ns.isBusy() : focus);
        }
        return false;
    }

    takeBestHackingCourse(ns, focus = 'auto') {
        return this.takeBestCourse(ns, PlayerStat.hacking, focus);
    }

    takeBestCharismaCourse(ns, focus = 'auto') {
        return this.takeBestCourse(ns, PlayerStat.charisma, focus);
    }

    takeBestCourse(ns, stat, focus = 'auto') {
        const course = UniversityCourse.getBestForStat(stat);

        return this.takeCourse(ns, course.name, focus);
    }
}

class Training {
    #ns;

    constructor(config) {
        this.#ns = config.ns;
    }

    get ns() {
        return this.#ns;
    }

    isNeeded() {
        return false;
    }

    async prepare() {
        // NOOP.
    }

    async execute() {

    }
}

class GymTraining extends Training {
    #gym;
    #city;
    #skill;
    #level;

    constructor(config) {
        super(config);
        this.#gym = config;
        this.#city = config;
    }
}