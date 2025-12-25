from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import pandas as pd
from datetime import datetime
import time

# League configurations
LEAGUES = {
    'Premier League': {
        'url': 'https://fbref.com/en/comps/9/Premier-League-Stats',
        'filename': 'premier_league_stats.csv'
    },
    'La Liga': {
        'url': 'https://fbref.com/en/comps/12/La-Liga-Stats',
        'filename': 'la_liga_stats.csv'
    },
    'Serie A': {
        'url': 'https://fbref.com/en/comps/11/Serie-A-Stats',
        'filename': 'serie_a_stats.csv'
    },
    'Bundesliga': {
        'url': 'https://fbref.com/en/comps/20/Bundesliga-Stats',
        'filename': 'bundesliga_stats.csv'
    }
}

def setup_driver():
    """
    Sets up and returns a Selenium WebDriver instance
    """
    print("Setting up browser...")
    
    # Configure Chrome options
    chrome_options = Options()
    chrome_options.add_argument('--headless')  # Run in background (remove to see browser)
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    # Initialize the Chrome driver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    return driver

def scrape_league_stats(driver, league_name, url):
    """
    Scrapes league table with xG stats from FBref using Selenium
    Returns: DataFrame with team statistics
    """
    print(f"\n{'='*60}")
    print(f"Scraping: {league_name}")
    print(f"{'='*60}")
    
    try:
        print(f"Navigating to {league_name}...")
        driver.get(url)
        
        # Wait for the page to load
        print("Waiting for table to load...")
        time.sleep(5)  # Give the page time to fully load
        
        # Wait for the table to be present
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "table"))
        )
        
        print("Extracting data...")
        
        # Get the page source and parse with pandas
        page_source = driver.page_source
        
        # Use pandas to read all tables
        tables = pd.read_html(page_source)
        
        # The league table is usually one of the first tables
        # Look for the table with the expected columns
        df = None
        for table in tables:
            # Check if this table has the columns we need
            if isinstance(table.columns, pd.MultiIndex):
                # Flatten multi-level columns
                cols = ['_'.join(str(i) for i in col).strip() for col in table.columns.values]
            else:
                cols = [str(col) for col in table.columns]
            
            # Check if this looks like the league table
            if any('Squad' in str(col) for col in cols) and any('Pts' in str(col) for col in cols):
                df = table
                break
        
        if df is None:
            print(f"Could not find the league table for {league_name}")
            return None
        
        # Clean up multi-level columns if present
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = ['_'.join(str(i) for i in col).strip() for col in df.columns.values]
        
        # Map columns to desired names
        column_mapping = {
            'Squad': 'Squad',
            'MP': 'MP',
            'W': 'W',
            'D': 'D',
            'L': 'L',
            'GF': 'GF',
            'GA': 'GA',
            'GD': 'GD',
            'Pts': 'Pts',
            'Pts/MP': 'Pts/MP',
            'xG': 'xG',
            'xGA': 'xGA',
            'xGD': 'xGD'
        }
        
        # Create clean dataframe with desired columns
        clean_data = {}
        for target_col, source_pattern in column_mapping.items():
            # Find matching column (case-insensitive, partial match)
            matching_col = None
            
            # Special handling for 'D' to avoid matching 'Squad' columns
            if source_pattern == 'D':
                for col in df.columns:
                    col_str = str(col).strip()
                    # Look for exact 'D' or patterns like 'Record_D', but not 'Squad'
                    if (col_str == 'D' or 
                        (col_str.endswith('_D') or col_str.endswith(' D')) and 
                        'squad' not in col_str.lower()):
                        matching_col = col
                        break
            else:
                for col in df.columns:
                    if source_pattern.lower() in str(col).lower():
                        matching_col = col
                        break
            
            if matching_col is not None:
                clean_data[target_col] = df[matching_col]
        
        result_df = pd.DataFrame(clean_data)
        
        # Calculate Pts/MP if not present
        if 'Pts/MP' not in result_df.columns and 'Pts' in result_df.columns and 'MP' in result_df.columns:
            result_df['Pts/MP'] = (pd.to_numeric(result_df['Pts'], errors='coerce') / 
                                    pd.to_numeric(result_df['MP'], errors='coerce')).round(2)
        
        # Calculate xGD if not present
        if 'xGD' not in result_df.columns and 'xG' in result_df.columns and 'xGA' in result_df.columns:
            result_df['xGD'] = (pd.to_numeric(result_df['xG'], errors='coerce') - 
                                pd.to_numeric(result_df['xGA'], errors='coerce')).round(2)
        
        # Remove any rows that might be header rows or empty
        result_df = result_df[result_df['Squad'].notna()]
        result_df = result_df[~result_df['Squad'].str.contains('Squad|Rk', case=False, na=False)]
        
        print(f"✓ Successfully scraped data for {len(result_df)} teams")
        return result_df
        
    except Exception as e:
        print(f"✗ Error scraping {league_name}: {e}")
        import traceback
        traceback.print_exc()
        return None

def save_to_csv(df, filename, league_name):
    """
    Saves the DataFrame to a CSV file
    """
    if df is not None and not df.empty:
        # Save to CSV
        df.to_csv(filename, index=False)
        print(f"✓ Data saved to {filename}")
        print(f"  Preview:")
        print(df.head(5).to_string(index=False))
    else:
        print(f"✗ No data to save for {league_name}")

def select_leagues():
    """
    Prompts user to select which leagues to scrape
    Returns: list of selected league names
    """
    print("\nAvailable leagues:")
    league_list = list(LEAGUES.keys())
    
    for i, league in enumerate(league_list, 1):
        print(f"  {i}. {league}")
    print(f"  {len(league_list) + 1}. All leagues")
    
    while True:
        choice = input("\nEnter your choice (number or comma-separated numbers, e.g., 1,3): ").strip()
        
        try:
            # Check if user wants all leagues
            if choice == str(len(league_list) + 1):
                return league_list
            
            # Parse comma-separated choices
            choices = [int(c.strip()) for c in choice.split(',')]
            
            # Validate choices
            if all(1 <= c <= len(league_list) for c in choices):
                selected = [league_list[c - 1] for c in choices]
                return selected
            else:
                print(f"Please enter numbers between 1 and {len(league_list) + 1}")
        except ValueError:
            print("Invalid input. Please enter numbers separated by commas (e.g., 1,3)")

def main():
    """
    Main function to run the scraper for selected leagues
    """
    print("=" * 60)
    print("FBref Multi-League Stats Scraper (Selenium)")
    print("=" * 60)
    
    # Let user select leagues
    selected_leagues = select_leagues()
    
    print("\n" + "=" * 60)
    print(f"Scraping {len(selected_leagues)} league(s): {', '.join(selected_leagues)}")
    print("=" * 60)
    
    driver = None
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    results = []
    
    try:
        # Set up the browser once
        driver = setup_driver()
        print("✓ Browser ready\n")
        
        # Scrape each selected league
        for i, league_name in enumerate(selected_leagues):
            config = LEAGUES[league_name]
            df = scrape_league_stats(driver, league_name, config['url'])
            
            if df is not None:
                save_to_csv(df, config['filename'], league_name)
                results.append({'league': league_name, 'status': 'Success', 'teams': len(df)})
            else:
                results.append({'league': league_name, 'status': 'Failed', 'teams': 0})
            
            # Be respectful - wait between requests
            if i < len(selected_leagues) - 1:  # Don't wait after last league
                print("Waiting before next league...")
                time.sleep(3)
        
        # Summary
        print("\n" + "=" * 60)
        print("SCRAPING SUMMARY")
        print("=" * 60)
        print(f"Timestamp: {timestamp}")
        print()
        for result in results:
            status_symbol = "✓" if result['status'] == 'Success' else "✗"
            print(f"{status_symbol} {result['league']}: {result['status']} ({result['teams']} teams)")
        print("=" * 60)
        
        success_count = sum(1 for r in results if r['status'] == 'Success')
        print(f"\nCompleted: {success_count}/{len(selected_leagues)} league(s) scraped successfully")
        
    except Exception as e:
        print(f"\nFatal error: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        # Always close the browser
        if driver:
            print("\nClosing browser...")
            driver.quit()
            print("✓ Browser closed")

if __name__ == "__main__":
    main()