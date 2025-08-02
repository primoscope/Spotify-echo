#!/usr/bin/env python3
"""
Test DigitalOcean App Platform YAML configuration structure.
This test ensures the YAML files follow the correct DigitalOcean App Platform format.
"""
import yaml
import unittest
import os

class TestDigitalOceanYAMLStructure(unittest.TestCase):
    """Test DigitalOcean App Platform YAML configuration structure"""
    
    def setUp(self):
        """Set up test paths"""
        self.base_path = "/home/runner/work/Spotify-echo/Spotify-echo"
        self.app_yaml_path = f"{self.base_path}/.do/app.yaml"
        self.deploy_template_path = f"{self.base_path}/.do/deploy.template.yaml"
    
    def load_yaml_file(self, file_path):
        """Load and parse YAML file"""
        with open(file_path, 'r') as f:
            return yaml.safe_load(f)
    
    def test_app_yaml_structure(self):
        """Test .do/app.yaml has correct DigitalOcean structure"""
        self.assertTrue(os.path.exists(self.app_yaml_path), "app.yaml should exist")
        
        data = self.load_yaml_file(self.app_yaml_path)
        
        # Should NOT have top-level name
        self.assertNotIn('name', data, "Top-level 'name' key should not exist")
        
        # Should have services as a list
        self.assertIn('services', data, "'services' key should exist")
        self.assertIsInstance(data['services'], list, "'services' should be a list")
        self.assertGreater(len(data['services']), 0, "Should have at least one service")
        
        # First service should have correct structure
        service = data['services'][0]
        self.assertIn('name', service, "Service should have 'name' key")
        self.assertEqual(service['name'], 'web', "Service name should be 'web'")
        self.assertIn('environment_slug', service, "Service should have 'environment_slug'")
        self.assertIn('github', service, "Service should have 'github' configuration")
        self.assertIn('build_command', service, "Service should have 'build_command'")
        self.assertIn('run_command', service, "Service should have 'run_command'")
        self.assertIn('http_port', service, "Service should have 'http_port'")
    
    def test_deploy_template_yaml_structure(self):
        """Test .do/deploy.template.yaml has correct DigitalOcean structure"""
        self.assertTrue(os.path.exists(self.deploy_template_path), "deploy.template.yaml should exist")
        
        data = self.load_yaml_file(self.deploy_template_path)
        
        # Should NOT have top-level name
        self.assertNotIn('name', data, "Top-level 'name' key should not exist")
        
        # Should have services as a list
        self.assertIn('services', data, "'services' key should exist")
        self.assertIsInstance(data['services'], list, "'services' should be a list")
        self.assertGreater(len(data['services']), 0, "Should have at least one service")
        
        # First service should have correct structure
        service = data['services'][0]
        self.assertIn('name', service, "Service should have 'name' key")
        self.assertEqual(service['name'], 'web', "Service name should be 'web'")
        self.assertIn('environment_slug', service, "Service should have 'environment_slug'")
        self.assertIn('github', service, "Service should have 'github' configuration")
        self.assertIn('build_command', service, "Service should have 'build_command'")
        self.assertIn('run_command', service, "Service should have 'run_command'")
    
    def test_yaml_syntax_valid(self):
        """Test both YAML files have valid syntax"""
        # Test app.yaml
        try:
            self.load_yaml_file(self.app_yaml_path)
        except yaml.YAMLError as e:
            self.fail(f"app.yaml has invalid YAML syntax: {e}")
        
        # Test deploy.template.yaml
        try:
            self.load_yaml_file(self.deploy_template_path)
        except yaml.YAMLError as e:
            self.fail(f"deploy.template.yaml has invalid YAML syntax: {e}")
    
    def test_required_service_properties(self):
        """Test that required service properties are present"""
        required_properties = [
            'name', 'environment_slug', 'github', 'build_command', 
            'run_command', 'http_port', 'instance_count', 'instance_size_slug'
        ]
        
        for yaml_file in [self.app_yaml_path, self.deploy_template_path]:
            with self.subTest(file=yaml_file):
                data = self.load_yaml_file(yaml_file)
                service = data['services'][0]
                
                for prop in required_properties:
                    if prop in ['instance_count', 'instance_size_slug'] and yaml_file == self.deploy_template_path:
                        # These might not be in the template
                        continue
                    self.assertIn(prop, service, f"Service should have '{prop}' property in {yaml_file}")

if __name__ == '__main__':
    # Change to the repository directory
    os.chdir("/home/runner/work/Spotify-echo/Spotify-echo")
    unittest.main(verbosity=2)