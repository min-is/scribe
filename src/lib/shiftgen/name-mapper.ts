/**
 * Name Mapper
 *
 * Standardizes provider and scribe names using a JSON legend file
 */

import { promises as fs } from 'fs';
import path from 'path';
import { NAME_LEGEND_FILE } from './config';

interface NameLegend {
  physicians: Record<string, string>;
  mlps: Record<string, string>;
}

export class NameMapper {
  private legendFile: string;
  private physicianMap: Record<string, string> = {};
  private mlpMap: Record<string, string> = {};
  private newPhysicians: Set<string> = new Set();
  private newMlps: Set<string> = new Set();

  constructor(legendFile?: string) {
    this.legendFile = legendFile || NAME_LEGEND_FILE;
  }

  /**
   * Load name mappings from JSON
   */
  async loadLegend(): Promise<void> {
    try {
      const filePath = path.resolve(process.cwd(), this.legendFile);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data: NameLegend = JSON.parse(fileContent);

      this.physicianMap = data.physicians || {};
      this.mlpMap = data.mlps || {};

      console.log(
        `Loaded name legend with ${Object.keys(this.physicianMap).length} physicians and ${Object.keys(this.mlpMap).length} MLPs`
      );
    } catch (error) {
      console.warn('Could not load legend file, creating default:', error);
      await this.createDefaultLegend();
    }
  }

  /**
   * Create default legend file
   */
  private async createDefaultLegend(): Promise<void> {
    const defaultLegend: NameLegend = {
      physicians: {
        ABDELKERIM: 'Dr. Abdelkerim',
        ALCID: 'Dr. Alcid',
        ANDERSON: 'Dr. Anderson',
        ARAFA: 'Dr. Arafa',
        ASSAF: 'Dr. Assaf',
        AYALIN: 'Dr. Ayalin',
        BANSIL: 'Dr. Bansil',
        BRINDIS: 'Dr. Brindis',
        DICKSON: 'Dr. Dickson',
        DOERING: 'Dr. Doering',
        ENGLAND: 'Dr. England',
        FIERRO: 'Dr. Fierro',
        GOLD: 'Dr. Gold',
        GOMEZ: 'Dr. Gomez',
        GROMIS: 'Dr. Gromis',
        HEDLAND: 'Dr. Hedland',
        HEYMING: 'Dr. Heyming',
        HUGHES: 'Dr. Hughes',
        JARRETT: 'Dr. Jarrett',
        JAYAMAHA: 'Dr. Jayamaha',
        JONES: 'Dr. Jones',
        KEAR: 'Dr. Kear',
        KIM: 'Dr. Kim',
        LAPLANT: 'Dr. Laplant',
        LASALA: 'Dr. Lasala',
        LEE: 'Dr. Lee',
        LI: 'Dr. Li',
        LUU: 'Dr. Luu',
        MEHTA: 'Dr. Mehta',
        MERJANIAN: 'Dr. Merjanian',
        MIKHAIL: 'Dr. Mikhail',
        MINASYAN: 'Dr. Minasyan',
        MIRCHANDANI: 'Dr. Mirchandani',
        MITTAL: 'Dr. Mittal',
        MOLNAR: 'Dr. Molnar',
        MULLARKY: 'Dr. Mullarky',
        MURPHY: 'Dr. Murphy',
        NAVARRO: 'Dr. Navarro',
        ORANTES: 'Dr. Orantes',
        PAUL: 'Dr. Paul',
        PIROUTEK: 'Dr. Piroutek',
        POWELL: 'Dr. Powell',
        RIVERS: 'Dr. Rivers',
        ROGAN: 'Dr. Rogan',
        RUDOLPH: 'Dr. Rudolph',
        RUIZ: 'Dr. Ruiz',
        SAINTGEORGES: 'Dr. Saintgeorges',
        SHIEH: 'Dr. Shieh',
        SHNITER: 'Dr. Shniter',
        SIEMBIEDA: 'Dr. Siembieda',
        SINGH: 'Dr. Singh',
        SMITH: 'Dr. Smith',
        STARR: 'Dr. Starr',
        VALENTE: 'Dr. Valente',
        YAO: 'Dr. Yao',
        YUAN: 'Dr. Yuan',
      },
      mlps: {
        DEOGRACIA: 'Reagan Deogracia',
        DHALIWAL: 'Namneet Dhaliwal',
        FURTEK: 'Marryanne Furtek',
        GERMANN: 'Quentin Germann',
        GO: 'Kyungsoo Go (Korrin)',
        GREEN: 'Geoffrey Green (Geoff)',
        GYORE: 'Victoria Gyore',
        JIVAN: 'Elizabeth Jivan (Liz)',
        KAMACHI: 'Roland Kamachi',
        'M. CAMPBELL': 'M. Campbell',
        MARONY: 'Gregory Marony (Greg)',
        NISHIOKA: 'John Nishioka (Nish)',
        REID: 'Craig Reid',
        REPPER: 'Danielle Chater Lea (Dani)',
        SHAHINYAN: 'Liana Shahinyan',
        VAFAEIAN: 'Rojin Vafaeian',
        ZWICK: 'Tamar Zwick',
      },
    };

    try {
      const filePath = path.resolve(process.cwd(), this.legendFile);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(defaultLegend, null, 2));
      console.log(`Created default legend file: ${this.legendFile}`);
      console.log('   Please edit this file to add your name mappings');
      this.physicianMap = defaultLegend.physicians;
      this.mlpMap = defaultLegend.mlps;
    } catch (error) {
      console.error('Error creating default legend:', error);
    }
  }

  /**
   * Standardize a name based on role and legend
   */
  standardizeName(rawName: string, role: string): string {
    if (!rawName || rawName === 'EMPTY') {
      return rawName;
    }

    const lookupKey = rawName.trim().toUpperCase();

    if (role === 'Physician') {
      if (lookupKey in this.physicianMap) {
        return this.physicianMap[lookupKey];
      } else {
        this.newPhysicians.add(lookupKey);
        return `Dr. ${this.toTitleCase(rawName)}`;
      }
    } else if (role === 'MLP') {
      if (lookupKey in this.mlpMap) {
        return this.mlpMap[lookupKey];
      } else {
        this.newMlps.add(lookupKey);
        return `${this.toTitleCase(rawName)}, PA-C`;
      }
    } else {
      // Scribe
      return this.toTitleCase(rawName);
    }
  }

  /**
   * Save newly discovered providers to legend file
   */
  async saveUpdates(): Promise<void> {
    if (this.newPhysicians.size === 0 && this.newMlps.size === 0) {
      return;
    }

    // Add new entries with placeholder formatting
    for (const physician of this.newPhysicians) {
      this.physicianMap[physician] = `Dr. ${this.toTitleCase(physician)}`;
    }

    for (const mlp of this.newMlps) {
      this.mlpMap[mlp] = `${this.toTitleCase(mlp)}, PA-C`;
    }

    // Save updated legend
    const updatedLegend: NameLegend = {
      physicians: this.sortObject(this.physicianMap),
      mlps: this.sortObject(this.mlpMap),
    };

    try {
      const filePath = path.resolve(process.cwd(), this.legendFile);
      await fs.writeFile(filePath, JSON.stringify(updatedLegend, null, 2));

      if (this.newPhysicians.size > 0 || this.newMlps.size > 0) {
        console.log('\n📝 Updated legend file:');
        if (this.newPhysicians.size > 0) {
          console.log(
            `   Added ${this.newPhysicians.size} new physician(s): ${Array.from(this.newPhysicians).sort().join(', ')}`
          );
        }
        if (this.newMlps.size > 0) {
          console.log(
            `   Added ${this.newMlps.size} new MLP(s): ${Array.from(this.newMlps).sort().join(', ')}`
          );
        }
        console.log(`   Please edit ${this.legendFile} to customize the full names`);
      }
    } catch (error) {
      console.error('Error saving legend updates:', error);
    }
  }

  /**
   * Convert string to title case
   */
  private toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(/[\s-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Sort object keys alphabetically
   */
  private sortObject<T>(obj: Record<string, T>): Record<string, T> {
    return Object.keys(obj)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = obj[key];
          return acc;
        },
        {} as Record<string, T>
      );
  }
}
