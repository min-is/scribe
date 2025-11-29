/**
 * ShiftGen Name Mapper
 * Standardizes provider and MLP names using a legend file
 */

import { promises as fs } from 'fs';
import path from 'path';
import { NameLegend } from './types';
import { NAME_LEGEND_PATH } from './config';

export class NameMapper {
  private physicianMap: Record<string, string> = {};
  private mlpMap: Record<string, string> = {};
  private legendPath: string;
  private newPhysicians: Set<string> = new Set();
  private newMLPs: Set<string> = new Set();

  constructor(legendPath?: string) {
    this.legendPath = legendPath || NAME_LEGEND_PATH;
  }

  /**
   * Load name mappings from JSON file
   */
  async loadLegend(): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), this.legendPath);
      const fileContent = await fs.readFile(fullPath, 'utf-8');
      const data: NameLegend = JSON.parse(fileContent);
      this.physicianMap = data.physicians || {};
      this.mlpMap = data.mlps || {};
      console.log(`Loaded name legend with ${Object.keys(this.physicianMap).length} physicians and ${Object.keys(this.mlpMap).length} MLPs`);
    } catch (error) {
      console.log('Name legend file not found, using defaults');
      await this.createDefaultLegend();
    }
  }

  /**
   * Create default legend file
   */
  private async createDefaultLegend(): Promise<void> {
    const defaultLegend: NameLegend = {
      physicians: {
        'ABDELKERIM': 'Dr. Abdelkerim',
        'ALCID': 'Dr. Alcid',
        'ANDERSON': 'Dr. Anderson',
        'ARAFA': 'Dr. Arafa',
        'ASSAF': 'Dr. Assaf',
        'AYALIN': 'Dr. Ayalin',
        'BANSIL': 'Dr. Bansil',
        'BRINDIS': 'Dr. Brindis',
        'DICKSON': 'Dr. Dickson',
        'DOERING': 'Dr. Doering',
        'ENGLAND': 'Dr. England',
        'FIERRO': 'Dr. Fierro',
        'GOLD': 'Dr. Gold',
        'GOMEZ': 'Dr. Gomez',
        'GROMIS': 'Dr. Gromis',
        'HEDLAND': 'Dr. Hedland',
        'HEYMING': 'Dr. Heyming',
        'HUGHES': 'Dr. Hughes',
        'JARRETT': 'Dr. Jarrett',
        'JAYAMAHA': 'Dr. Jayamaha',
        'JONES': 'Dr. Jones',
        'KEAR': 'Dr. Kear',
        'KIM': 'Dr. Kim',
        'LAPLANT': 'Dr. Laplant',
        'LASALA': 'Dr. Lasala',
        'LEE': 'Dr. Lee',
        'LI': 'Dr. Li',
        'LUU': 'Dr. Luu',
        'MEHTA': 'Dr. Mehta',
        'MERJANIAN': 'Dr. Merjanian',
        'MIKHAIL': 'Dr. Mikhail',
        'MINASYAN': 'Dr. Minasyan',
        'MIRCHANDANI': 'Dr. Mirchandani',
        'MITTAL': 'Dr. Mittal',
        'MOLNAR': 'Dr. Molnar',
        'MULLARKY': 'Dr. Mullarky',
        'MURPHY': 'Dr. Murphy',
        'NAVARRO': 'Dr. Navarro',
        'ORANTES': 'Dr. Orantes',
        'PAUL': 'Dr. Paul',
        'PIROUTEK': 'Dr. Piroutek',
        'POWELL': 'Dr. Powell',
        'RIVERS': 'Dr. Rivers',
        'ROGAN': 'Dr. Rogan',
        'RUDOLPH': 'Dr. Rudolph',
        'RUIZ': 'Dr. Ruiz',
        'SAINTGEORGES': 'Dr. Saintgeorges',
        'SHIEH': 'Dr. Shieh',
        'SHNITER': 'Dr. Shniter',
        'SIEMBIEDA': 'Dr. Siembieda',
        'SINGH': 'Dr. Singh',
        'SMITH': 'Dr. Smith',
        'STARR': 'Dr. Starr',
        'VALENTE': 'Dr. Valente',
        'YAO': 'Dr. Yao',
        'YUAN': 'Dr. Yuan',
      },
      mlps: {
        'DEOGRACIA': 'Reagan Deogracia',
        'DHALIWAL': 'Namneet Dhaliwal',
        'FURTEK': 'Marryanne Furtek',
        'GERMANN': 'Quentin Germann',
        'GO': 'Kyungsoo Go (Korrin)',
        'GREEN': 'Geoffrey Green (Geoff)',
        'GYORE': 'Victoria Gyore',
        'JIVAN': 'Elizabeth Jivan (Liz)',
        'KAMACHI': 'Roland Kamachi',
        'M. CAMPBELL': 'M. Campbell',
        'MARONY': 'Gregory Marony (Greg)',
        'NISHIOKA': 'John Nishioka (Nish)',
        'REID': 'Craig Reid',
        'REPPER': 'Danielle Chater Lea (Dani)',
        'SHAHINYAN': 'Liana Shahinyan',
        'VAFAEIAN': 'Rojin Vafaeian',
        'ZWICK': 'Tamar Zwick',
      },
    };

    this.physicianMap = defaultLegend.physicians;
    this.mlpMap = defaultLegend.mlps;

    // Try to create legend file, but don't fail if we can't
    try {
      const fullPath = path.join(process.cwd(), this.legendPath);
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, JSON.stringify(defaultLegend, null, 2));
      console.log(`Created default legend file: ${this.legendPath}`);
    } catch (error) {
      console.log('Could not create legend file, using in-memory defaults');
    }
  }

  /**
   * Standardize a name based on role and legend
   */
  standardizeName(rawName: string, role: string): string {
    if (!rawName || rawName === 'EMPTY') return rawName;

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
        this.newMLPs.add(lookupKey);
        return `${this.toTitleCase(rawName)}, PA-C`;
      }
    } else {
      // Scribe
      return this.toTitleCase(rawName);
    }
  }

  /**
   * Convert string to title case
   */
  private toTitleCase(str: string): string {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Save any newly discovered providers to the legend file
   */
  async saveUpdates(): Promise<void> {
    if (this.newPhysicians.size === 0 && this.newMLPs.size === 0) {
      return;
    }

    // Add new entries with placeholder formatting
    for (const physician of this.newPhysicians) {
      this.physicianMap[physician] = `Dr. ${this.toTitleCase(physician)}`;
    }

    for (const mlp of this.newMLPs) {
      this.mlpMap[mlp] = `${this.toTitleCase(mlp)}, PA-C`;
    }

    // Sort and save updated legend
    const sortedPhysicians = Object.fromEntries(
      Object.entries(this.physicianMap).sort(([a], [b]) => a.localeCompare(b))
    );
    const sortedMLPs = Object.fromEntries(
      Object.entries(this.mlpMap).sort(([a], [b]) => a.localeCompare(b))
    );

    const updatedLegend: NameLegend = {
      physicians: sortedPhysicians,
      mlps: sortedMLPs,
    };

    try {
      const fullPath = path.join(process.cwd(), this.legendPath);
      await fs.writeFile(fullPath, JSON.stringify(updatedLegend, null, 2));

      if (this.newPhysicians.size > 0 || this.newMLPs.size > 0) {
        console.log('\n📝 Updated legend file:');
        if (this.newPhysicians.size > 0) {
          console.log(`   Added ${this.newPhysicians.size} new physician(s): ${Array.from(this.newPhysicians).sort().join(', ')}`);
        }
        if (this.newMLPs.size > 0) {
          console.log(`   Added ${this.newMLPs.size} new MLP(s): ${Array.from(this.newMLPs).sort().join(', ')}`);
        }
        console.log(`   Please edit ${this.legendPath} to customize the full names`);
      }
    } catch (error) {
      console.error('Failed to save legend updates:', error);
    }
  }

  /**
   * Get statistics about new entries
   */
  getStats(): { newPhysicians: number; newMLPs: number } {
    return {
      newPhysicians: this.newPhysicians.size,
      newMLPs: this.newMLPs.size,
    };
  }
}
