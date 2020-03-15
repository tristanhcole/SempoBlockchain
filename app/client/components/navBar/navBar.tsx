import * as React from "react";
import { Mobile, Default } from "../helpers/responsive";
import { connect } from "react-redux";
import styled from "styled-components";
import { NavLink } from "react-router-dom";

import { LoginAction } from "../../reducers/auth/actions";
import { LoginState, OrganisationFlat } from "../../reducers/auth/loginReducer";
import { ReduxState } from "../../reducers/rootReducer";
import { replaceSpaces } from "../../utils";
import { SVG, StyledLogoLink } from "./styles";
import MobileTopBar from "./MobileTopBar";

interface StateProps {
  loggedIn: boolean;
  login: LoginState;
  email: string | null;
  orgName: string;
}

interface DispatchProps {
  updateActiveOrgRequest: (payload: OrganisationFlat) => any;
}

const initialState = Object.freeze({
  iconURL: "/static/media/sempo_icon.svg",
  mobileMenuOpen: false,
  isOrgSwitcherActive: false
});

type Props = DispatchProps & StateProps;
type State = typeof initialState;

declare global {
  interface Window {
    DEPLOYMENT_NAME: string;
    ETH_EXPLORER_URL: string;
    USING_EXTERNAL_ERC20: boolean;
    master_wallet_address: string;
    ETH_CONTRACT_ADDRESS: string;
  }
}

class NavBar extends React.Component<Props, State> {
  readonly state = initialState;

  componentWillMount() {
    let deploymentName = window.DEPLOYMENT_NAME;

    //TODO: Allow setting of region for this
    let s3_region = "https://sempo-logos.s3-ap-southeast-2.amazonaws.com";
    let custom_url = `${s3_region}/${this.props.orgName.toLowerCase()}.${
      deploymentName === "dev" ? "svg" : "png"
    }`;

    this.imageExists(custom_url, exists => {
      if (exists) {
        this.setState({
          iconURL: custom_url
        });
      }
    });
  }

  componentWillUnmount() {
    this.setState({ mobileMenuOpen: false });
  }

  handleClick() {
    this.setState({ mobileMenuOpen: false });
  }

  openMobileMenu() {
    this.setState(prevState => ({
      mobileMenuOpen: !prevState.mobileMenuOpen
    }));
  }

  selectOrg(org: OrganisationFlat) {
    this.setState({ isOrgSwitcherActive: false }, () =>
      this.props.updateActiveOrgRequest(org)
    );
  }

  toggleSwitchOrgDropdown() {
    if (
      this.props.login.organisations == null ||
      this.props.login.organisations.length <= 1
    ) {
      return;
    }

    this.setState(prevState => ({
      isOrgSwitcherActive: !prevState.isOrgSwitcherActive
    }));
  }

  imageExists(url: string, callback: (exists: boolean) => any) {
    var img = new Image();
    img.onload = function() {
      callback(true);
    };
    img.onerror = function() {
      callback(false);
    };
    img.src = url;
  }

  _closeMobileMenu() {
    this.setState({ mobileMenuOpen: false });
  }

  render() {
    var tracker_link =
      window.ETH_EXPLORER_URL +
      "/address/" +
      (window.USING_EXTERNAL_ERC20
        ? window.master_wallet_address
        : window.ETH_CONTRACT_ADDRESS);

    var orgs = this.props.login.organisations;
    if (orgs === null || typeof orgs === "undefined") {
      orgs = [];
    }

    if (this.props.loggedIn) {
      return (
        <div>
          <SideBarWrapper mobileMenuOpen={this.state.mobileMenuOpen}>
            <Mobile>
              <MobileTopBar
                iconUrl={this.state.iconURL}
                email={this.props.email}
                menuOpen={this.state.mobileMenuOpen}
                onPress={() => this.openMobileMenu()}
              />
            </Mobile>

            <SideBarNavigationItems>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Default>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      cursor: "pointer"
                    }}
                  >
                    <StyledLogoLink
                      to="/"
                      onClick={() => this._closeMobileMenu()}
                    >
                      <SVG src={this.state.iconURL} />
                    </StyledLogoLink>
                    <div
                      style={{
                        display: "flex",
                        width: "100%",
                        justifyContent: "space-between"
                      }}
                      onClick={() => this.toggleSwitchOrgDropdown()}
                    >
                      <div style={{ margin: "auto 0", maxWidth: "100px" }}>
                        <BoldedNavBarHeaderText>
                          {this.props.login.organisationName}
                        </BoldedNavBarHeaderText>
                        <StandardNavBarHeaderText>
                          {this.props.email}
                        </StandardNavBarHeaderText>
                      </div>
                      {orgs.length <= 1 ? null : (
                        <SVG
                          style={{ padding: "0 0.5em 0 0", width: "30px" }}
                          src={"/static/media/angle-down.svg"}
                        />
                      )}
                    </div>
                  </div>
                  <DropdownContent
                    style={{
                      display: this.state.isOrgSwitcherActive
                        ? "block"
                        : "none",
                      zIndex: 99
                    }}
                  >
                    <DropdownContentTitle>
                      Switch Organisation
                    </DropdownContentTitle>
                    {orgs.map(org => {
                      return (
                        <DropdownContentText
                          key={org.id}
                          onClick={() => this.selectOrg(org)}
                        >
                          {org.name}
                        </DropdownContentText>
                      );
                    })}
                  </DropdownContent>
                  <div
                    style={{
                      display: this.state.isOrgSwitcherActive
                        ? "block"
                        : "none",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      zIndex: 98,
                      width: "100vw",
                      height: "100vh"
                    }}
                    onClick={() => this.toggleSwitchOrgDropdown()}
                  />
                </Default>

                <NavWrapper mobileMenuOpen={this.state.mobileMenuOpen}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <StyledLink
                      to="/"
                      exact
                      onClick={() => this._closeMobileMenu()}
                    >
                      Dashboard
                    </StyledLink>
                    <StyledLink
                      to="/accounts"
                      onClick={() => this._closeMobileMenu()}
                    >
                      Accounts
                    </StyledLink>
                    <StyledLink
                      to="/transfers"
                      onClick={() => this._closeMobileMenu()}
                    >
                      Transfers
                    </StyledLink>
                    <StyledLink
                      to="/settings"
                      onClick={() => this._closeMobileMenu()}
                    >
                      Settings
                    </StyledLink>
                  </div>
                  <ContractAddress href={tracker_link} target="_blank">
                    {window.USING_EXTERNAL_ERC20
                      ? "Master Wallet Tracker"
                      : "Contract Tracker"}
                  </ContractAddress>
                </NavWrapper>
              </div>
            </SideBarNavigationItems>
          </SideBarWrapper>
        </div>
      );
    } else {
      return <div></div>;
    }
  }
}

const mapStateToProps = (state: ReduxState): StateProps => {
  return {
    loggedIn: state.login.token != null,
    login: state.login,
    email: state.login.email,
    orgName: replaceSpaces(state.login.organisationName)
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    updateActiveOrgRequest: (payload: OrganisationFlat) =>
      dispatch(LoginAction.updateActiveOrgRequest(payload))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NavBar);

const SideBarWrapper = styled.div<any>`
  width: 234px;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  background-color: #2b333b;
  -webkit-user-select: none;
  z-index: 501;
  @media (max-width: 767px) {
    display: flex;
    width: 100vw;
    flex-direction: column;
    height: ${props => (props.mobileMenuOpen ? "" : "50px")};
  }
`;

const NavWrapper = styled.div<any>`
  @media (max-width: 767px) {
    display: ${props => (props.mobileMenuOpen ? "" : "none")};
  }
`;

const SideBarNavigationItems = styled.div`
  display: flex;
  flex-direction: column;
`;

const activeClassName = "active-link";

const StyledLink = styled(NavLink).attrs({
  activeClassName
})`
  color: #9a9a9a;
  font-size: 12px;
  text-decoration: none;
  font-weight: 400;
  padding: 1em 2em;
  &:hover,
  &.${activeClassName} {
    color: #fff;
    background-color: #3d454d;
  }
  @media (max-width: 767px) {
    font-size: 16px;
  }
`;

const ContractAddress = styled.a`
  color: #fff;
  margin: auto 2em;
  font-size: 12px;
  text-decoration: none;
  font-weight: 400;
  position: absolute;
  bottom: 1em;
  @media (max-width: 767px) {
    text-align: center;
    font-size: 16px;
    left: 0;
    right: 0;
    color: #85898c;
  }
`;

const StandardNavBarHeaderText = styled.p`
  color: #fff;
  margin: 0;
  font-size: 12px;
  text-decoration: none;
  text-overflow: ellipsis;
  overflow: auto;
  overflow-x: hidden;
`;

const BoldedNavBarHeaderText = styled(StandardNavBarHeaderText)`
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
`;

const DropdownContent = styled.div`
  display: none;
  position: absolute;
  top: 74px;
  background-color: #f9f9f9;
  min-width: 160px;
  width: 234px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  z-index: 1;
`;

const DropdownContentText = styled.p`
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  margin: 0;
  border-bottom: 0.5px solid #80808059;
  &:hover {
    background-color: #f1f1f1;
  }
`;

const DropdownContentTitle = styled(DropdownContentText)`
  text-transform: uppercase;
  font-size: 12px;
  font-weight: bold;
  color: grey;
  padding: 5px 16px;
`;
