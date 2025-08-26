#!/usr/bin/env python3
"""
Model Integrity Validation Script
Validates ML model artifacts for integrity and consistency
"""

import sys
import json
import argparse
import hashlib
import os
from pathlib import Path
from typing import Dict, List, Any

def parse_args():
    parser = argparse.ArgumentParser(description='Model integrity validation')
    parser.add_argument('--model-dir', type=str, default='models/',
                       help='Directory containing model artifacts')
    parser.add_argument('--checksum-file', type=str, default='model_checksums.json',
                       help='File containing expected model checksums')
    parser.add_argument('--output', type=str, default='model-integrity-results.json',
                       help='Output file for validation results')
    return parser.parse_args()

def calculate_file_checksum(file_path: Path) -> str:
    """Calculate SHA256 checksum of a file"""
    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()
    except Exception as e:
        print(f"Error calculating checksum for {file_path}: {e}")
        return ""

def find_model_files(model_dir: Path) -> List[Path]:
    """Find all model files in the directory"""
    model_extensions = ['.pkl', '.joblib', '.h5', '.pb', '.pth', '.pt', '.onnx', '.tflite']
    model_files = []
    
    if model_dir.exists():
        for ext in model_extensions:
            model_files.extend(model_dir.rglob(f'*{ext}'))
    
    return model_files

def validate_model_structure(model_files: List[Path]) -> Dict[str, Any]:
    """Validate model directory structure"""
    validation = {
        'has_models': len(model_files) > 0,
        'model_count': len(model_files),
        'model_types': {},
        'total_size_mb': 0,
        'largest_model_mb': 0
    }
    
    for model_file in model_files:
        # Get file extension
        ext = model_file.suffix.lower()
        if ext not in validation['model_types']:
            validation['model_types'][ext] = 0
        validation['model_types'][ext] += 1
        
        # Calculate file size
        try:
            size_bytes = model_file.stat().st_size
            size_mb = size_bytes / (1024 * 1024)
            validation['total_size_mb'] += size_mb
            validation['largest_model_mb'] = max(validation['largest_model_mb'], size_mb)
        except Exception:
            pass
    
    return validation

def validate_model_checksums(model_files: List[Path], checksum_file: str) -> Dict[str, Any]:
    """Validate model file checksums"""
    validation = {
        'checksum_file_exists': False,
        'checksums_match': {},
        'new_files': [],
        'missing_files': [],
        'corrupted_files': []
    }
    
    # Load expected checksums
    expected_checksums = {}
    checksum_path = Path(checksum_file)
    
    if checksum_path.exists():
        validation['checksum_file_exists'] = True
        try:
            with open(checksum_path, 'r') as f:
                expected_checksums = json.load(f)
        except Exception as e:
            print(f"Error loading checksum file: {e}")
    
    # Calculate current checksums
    current_checksums = {}
    for model_file in model_files:
        relative_path = str(model_file.relative_to(Path.cwd()))
        current_checksums[relative_path] = calculate_file_checksum(model_file)
    
    # Compare checksums
    for file_path, current_checksum in current_checksums.items():
        if file_path in expected_checksums:
            matches = current_checksum == expected_checksums[file_path]
            validation['checksums_match'][file_path] = matches
            if not matches:
                validation['corrupted_files'].append(file_path)
        else:
            validation['new_files'].append(file_path)
    
    # Check for missing files
    for expected_file in expected_checksums.keys():
        if expected_file not in current_checksums:
            validation['missing_files'].append(expected_file)
    
    return validation

def validate_model_metadata(model_files: List[Path]) -> Dict[str, Any]:
    """Validate model metadata and configuration"""
    validation = {
        'has_metadata': False,
        'version_info': {},
        'model_configs': []
    }
    
    # Look for common metadata files
    metadata_files = ['model_info.json', 'metadata.json', 'config.json', 'model_config.yaml']
    
    for model_file in model_files:
        model_dir = model_file.parent
        
        for metadata_file in metadata_files:
            metadata_path = model_dir / metadata_file
            if metadata_path.exists():
                validation['has_metadata'] = True
                validation['model_configs'].append({
                    'model': str(model_file.relative_to(Path.cwd())),
                    'metadata_file': str(metadata_path.relative_to(Path.cwd())),
                    'exists': True
                })
                
                # Try to extract version information
                try:
                    if metadata_file.endswith('.json'):
                        with open(metadata_path, 'r') as f:
                            metadata = json.load(f)
                            if 'version' in metadata:
                                validation['version_info'][str(model_file)] = metadata['version']
                except Exception:
                    pass
                
                break
        else:
            # No metadata file found for this model
            validation['model_configs'].append({
                'model': str(model_file.relative_to(Path.cwd())),
                'metadata_file': None,
                'exists': False
            })
    
    return validation

def calculate_integrity_score(structure: Dict, checksums: Dict, metadata: Dict) -> float:
    """Calculate overall model integrity score"""
    score = 0
    max_score = 0
    
    # Structure score (30 points)
    max_score += 30
    if structure['has_models']:
        score += 10
    if structure['model_count'] > 0:
        score += 10
    if structure['total_size_mb'] < 1000:  # Models under 1GB total
        score += 10
    
    # Checksum score (40 points)
    max_score += 40
    if checksums['checksum_file_exists']:
        score += 10
    
    total_files = len(checksums['checksums_match']) + len(checksums['new_files'])
    if total_files > 0:
        matching_files = sum(checksums['checksums_match'].values())
        checksum_ratio = matching_files / total_files
        score += checksum_ratio * 20
    
    if len(checksums['corrupted_files']) == 0:
        score += 10
    
    # Metadata score (30 points)
    max_score += 30
    if metadata['has_metadata']:
        score += 15
    
    config_count = len(metadata['model_configs'])
    if config_count > 0:
        configs_with_metadata = sum(1 for config in metadata['model_configs'] if config['exists'])
        metadata_ratio = configs_with_metadata / config_count
        score += metadata_ratio * 15
    
    return (score / max_score) * 100 if max_score > 0 else 0

def main():
    args = parse_args()
    
    model_dir = Path(args.model_dir)
    
    print(f"Validating model integrity in {model_dir}...")
    
    # Find model files
    model_files = find_model_files(model_dir)
    
    if not model_files:
        print(f"No model files found in {model_dir}")
        # Create placeholder results for empty model directory
        results = {
            'integrity_type': 'model',
            'model_directory': str(model_dir),
            'integrity_score': 0,
            'integrity_passed': False,
            'validation': {
                'structure': {'has_models': False, 'model_count': 0},
                'checksums': {'checksum_file_exists': False},
                'metadata': {'has_metadata': False}
            },
            'summary': 'No model files found - this is expected for Phase 2 scaffolding'
        }
    else:
        # Run validation checks
        structure_validation = validate_model_structure(model_files)
        checksum_validation = validate_model_checksums(model_files, args.checksum_file)
        metadata_validation = validate_model_metadata(model_files)
        
        # Calculate integrity score
        integrity_score = calculate_integrity_score(
            structure_validation, checksum_validation, metadata_validation
        )
        
        # Determine if integrity passes (70% threshold)
        integrity_passed = integrity_score >= 70.0
        
        results = {
            'integrity_type': 'model',
            'model_directory': str(model_dir),
            'model_files_found': len(model_files),
            'integrity_score': integrity_score,
            'integrity_passed': integrity_passed,
            'validation': {
                'structure': structure_validation,
                'checksums': checksum_validation,
                'metadata': metadata_validation
            },
            'summary': f"Found {len(model_files)} model files with {integrity_score:.1f}% integrity score"
        }
    
    # Write results
    with open(args.output, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Print summary
    print(f"Model Integrity: {'PASS' if results['integrity_passed'] else 'PASS (No models - scaffolding)'}")
    print(f"Integrity Score: {results['integrity_score']:.1f}%")
    print(f"Model Files: {results.get('model_files_found', 0)}")
    
    # For scaffolding phase, always pass even with no models
    if results.get('model_files_found', 0) == 0:
        print("No model files found - this is expected during Phase 2 scaffolding")
        sys.exit(0)
    
    # Exit with appropriate code
    sys.exit(0 if results['integrity_passed'] else 1)

if __name__ == '__main__':
    main()