#############
### build ###
#############

# base image
FROM node:10.16.0 as build

LABEL org.jax.project="JAX Synteny Browser"
LABEL org.opencontainers.image.authors="synbrowser-support@jax.org"
LABEL org.opencontainers.image.source="https://github.com/TheJacksonLaboratory/syntenybrowserv2-ui.git"
LABEL org.opencontainers.image.version="0.0.1"

# set working directory
WORKDIR /sb

# add `/sb/node_modules/.bin` to $PATH
ENV PATH /sb/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /sb/package.json
RUN npm install
RUN npm install -g @angular/cli@8.3.20

# add sb
COPY . /sb

# generate build
RUN ng build --output-path=dist

############
### prod ###
############

# base image
FROM nginx:1.16.0-alpine

# copy artifact build from the 'build environment'
COPY --from=build /sb/dist /usr/share/nginx/html
COPY ./deploy/nginx-sb.conf /etc/nginx/conf.d/default.conf

# expose port 80
EXPOSE 80

# run nginx
CMD ["nginx", "-g", "daemon off;"]
