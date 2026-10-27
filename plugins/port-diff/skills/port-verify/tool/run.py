#!/usr/bin/env python3
"""Run the bundled port-diff without installing it."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from port_diff.cli import main
sys.argv[0] = "port-diff"
sys.exit(main())
