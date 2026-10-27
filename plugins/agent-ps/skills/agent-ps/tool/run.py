#!/usr/bin/env python3
"""Run the bundled agent-ps without installing it."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agent_ps.cli import main
sys.argv[0] = "agent-ps"
sys.exit(main())
