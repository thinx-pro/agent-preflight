#!/usr/bin/env python3
"""Run the bundled cheat-drill without installing it."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cheat_drill.cli import main
sys.argv[0] = "cheat-drill"
sys.exit(main())
