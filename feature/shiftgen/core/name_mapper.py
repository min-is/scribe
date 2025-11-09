import json
from pathlib import Path
from typing import Set


class NameMapper:
    """standardization with legend file"""
    
    def __init__(self, legend_file: str = "name_legend.json"):
        self.legend_file = Path(legend_file)
        self.physician_map = {}
        self.mlp_map = {}
        self.new_physicians: Set[str] = set()
        self.new_mlps: Set[str] = set()
        self.load_legend()
    
    def load_legend(self) -> None:
        """Load name mappings from JSON"""
        if self.legend_file.exists():
            try:
                with open(self.legend_file, 'r') as f:
                    data = json.load(f)
                    self.physician_map = data.get('physicians', {})
                    self.mlp_map = data.get('mlps', {})
                print(f"Loaded name legend with {len(self.physician_map)} physicians and {len(self.mlp_map)} MLPs")
            except Exception as e:
                print(f"Error loading legend: {e}")
        else:
            self._create_default_legend()
    
    def _create_default_legend(self) -> None:
        """default legend fallback"""
        default_legend = {
            "physicians": {
                "ABDELKERIM": "Dr. Abdelkerim",
                "ALCID": "Dr. Alcid",
                "ANDERSON": "Dr. Anderson",
                "ARAFA": "Dr. Arafa",
                "ASSAF": "Dr. Assaf",
                "AYALIN": "Dr. Ayalin",
                "BANSIL": "Dr. Bansil",
                "BRINDIS": "Dr. Brindis",
                "DICKSON": "Dr. Dickson",
                "DOERING": "Dr. Doering",
                "ENGLAND": "Dr. England",
                "FIERRO": "Dr. Fierro",
                "GOLD": "Dr. Gold",
                "GOMEZ": "Dr. Gomez",
                "GROMIS": "Dr. Gromis",
                "HEDLAND": "Dr. Hedland",
                "HEYMING": "Dr. Heyming",
                "HUGHES": "Dr. Hughes",
                "JARRETT": "Dr. Jarrett",
                "JAYAMAHA": "Dr. Jayamaha",
                "JONES": "Dr. Jones",
                "KEAR": "Dr. Kear",
                "KIM": "Dr. Kim",
                "LAPLANT": "Dr. Laplant",
                "LASALA": "Dr. Lasala",
                "LEE": "Dr. Lee",
                "LI": "Dr. Li",
                "LUU": "Dr. Luu",
                "MEHTA": "Dr. Mehta",
                "MERJANIAN": "Dr. Merjanian",
                "MIKHAIL": "Dr. Mikhail",
                "MINASYAN": "Dr. Minasyan",
                "MIRCHANDANI": "Dr. Mirchandani",
                "MITTAL": "Dr. Mittal",
                "MOLNAR": "Dr. Molnar",
                "MULLARKY": "Dr. Mullarky",
                "MURPHY": "Dr. Murphy",
                "NAVARRO": "Dr. Navarro",
                "ORANTES": "Dr. Orantes",
                "PAUL": "Dr. Paul",
                "PIROUTEK": "Dr. Piroutek",
                "POWELL": "Dr. Powell",
                "RIVERS": "Dr. Rivers",
                "ROGAN": "Dr. Rogan",
                "RUDOLPH": "Dr. Rudolph",
                "RUIZ": "Dr. Ruiz",
                "SAINTGEORGES": "Dr. Saintgeorges",
                "SHIEH": "Dr. Shieh",
                "SHNITER": "Dr. Shniter",
                "SIEMBIEDA": "Dr. Siembieda",
                "SINGH": "Dr. Singh",
                "SMITH": "Dr. Smith",
                "STARR": "Dr. Starr",
                "VALENTE": "Dr. Valente",
                "YAO": "Dr. Yao",
                "YUAN": "Dr. Yuan"
            },
            "mlps": {
                "DEOGRACIA": "Reagan Deogracia",
                "DHALIWAL": "Namneet Dhaliwal",
                "FURTEK": "Marryanne Furtek",
                "GERMANN": "Quentin Germann",
                "GO": "Kyungsoo Go (Korrin)",
                "GREEN": "Geoffrey Green (Geoff)",
                "GYORE": "Victoria Gyore",
                "JIVAN": "Elizabeth Jivan (Liz)",
                "KAMACHI": "Roland Kamachi",
                "M. CAMPBELL": "M. Campbell",
                "MARONY": "Gregory Marony (Greg)",
                "NISHIOKA": "John Nishioka (Nish)",
                "REID": "Craig Reid",
                "REPPER": "Danielle Chater Lea (Dani)",
                "SHAHINYAN": "Liana Shahinyan",
                "VAFAEIAN": "Rojin Vafaeian",
                "ZWICK": "Tamar Zwick"
            }
        }
        
        with open(self.legend_file, 'w') as f:
            json.dump(default_legend, f, indent=2)
        print(f"Created default legend file: {self.legend_file}")
        print("   Please edit this file to add your name mappings")
        self.physician_map = default_legend['physicians']
        self.mlp_map = default_legend['mlps']
    
    def standardize_name(self, raw_name: str, role: str) -> str:
        """
        Standardize a name based on role and legend.
        
        Args:
            raw_name: Raw name from schedule (usually last name in caps)
            role: Role type (Physician, MLP, or Scribe)
            
        Returns:
            Standardized name
        """
        if not raw_name or raw_name == "EMPTY":
            return raw_name
        
        lookup_key = raw_name.strip().upper()
        
        if role == "Physician":
            if lookup_key in self.physician_map:
                return self.physician_map[lookup_key]
            else:
                self.new_physicians.add(lookup_key)
                return f"Dr. {raw_name.title()}"
        elif role == "MLP":
            if lookup_key in self.mlp_map:
                return self.mlp_map[lookup_key]
            else:
                self.new_mlps.add(lookup_key)
                return f"{raw_name.title()}, PA-C"
        else:  # Scribe
            return raw_name.title()
    
    def save_updates(self) -> None:
        """save any newly discovered providers to the legend file"""
        if not self.new_physicians and not self.new_mlps:
            return
        
        # Add new entries with placeholder formatting
        for physician in self.new_physicians:
            self.physician_map[physician] = f"Dr. {physician.title()}"
        
        for mlp in self.new_mlps:
            self.mlp_map[mlp] = f"{mlp.title()}, PA-C"
        
        # save updated legend
        updated_legend = {
            "physicians": dict(sorted(self.physician_map.items())),
            "mlps": dict(sorted(self.mlp_map.items()))
        }
        
        with open(self.legend_file, 'w') as f:
            json.dump(updated_legend, f, indent=2)
        
        if self.new_physicians or self.new_mlps:
            print(f"\n📝 Updated legend file:")
            if self.new_physicians:
                print(f"   Added {len(self.new_physicians)} new physician(s): {', '.join(sorted(self.new_physicians))}")
            if self.new_mlps:
                print(f"   Added {len(self.new_mlps)} new MLP(s): {', '.join(sorted(self.new_mlps))}")
            print(f"   Please edit {self.legend_file} to customize the full names")